"use client";
import { use } from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  profile_pic?: string;
  dept?: string;
  year?: number;
  skills?: string[];
  email?: string;
};

type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: "leader" | "member";
  joined_at: string;
  user: User;
};

type JoinRequest = {
  id: string;
  team_id: string;
  user_id: string;
  status: "pending" | "accepted" | "rejected";
  requested_at: string;
  user: User;
};

type Team = {
  id: string;
  name: string;
  description: string | null;
  event_id: string;
  created_by: string | null;
  skills_needed: string[] | null;
  is_open: boolean;
  max_members: number;
  created_at: string;
};

type Event = {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
};

export default function TeamDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id: teamId } = use(params);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);

  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    isOpen: true,
    skills: [] as string[],
    currentSkill: "",
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchTeamDetails();
  }, [teamId]);

  useEffect(() => {
    if (team && currentUser) {
      // Check if current user is a team leader
      const userMember = members.find(
        (member) => member.user_id === currentUser.id
      );
      setIsTeamMember(!!userMember);
      setIsTeamLeader(userMember?.role === "leader");

      // Initialize edit form
      setEditFormData({
        name: team.name,
        description: team.description || "",
        isOpen: team.is_open,
        skills: team.skills_needed || [],
        currentSkill: "",
      });
    }
  }, [team, members, currentUser]);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setCurrentUser(data);
      }
    }
  };

  const fetchTeamDetails = async () => {
    setLoading(true);

    try {
      // Fetch team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", teamData.event_id)
        .single();

      if (eventData) setEvent(eventData);

      // Fetch members
      const { data: membersData } = await supabase
        .from("teammembers")
        .select(
          `
          *,
          user:user_id(*)
        `
        )
        .eq("team_id", teamId);

      if (membersData) setMembers(membersData);

      // Fetch join requests
      const { data: requestsData } = await supabase
        .from("teamjoinrequest")
        .select(
          `
          *,
          user:user_id(*)
        `
        )
        .eq("team_id", teamId)
        .eq("status", "pending");

      if (requestsData) setJoinRequests(requestsData);
    } catch (error) {
      console.error("Error fetching team details:", error);
      router.push("/teams");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    // Find the request to get the user ID
    const request = joinRequests.find((req) => req.id === requestId);
    if (!request) return;

    if (status === "accepted") {
      // Check team size
      if (members.length >= (team?.max_members || 0)) {
        alert(
          "Cannot accept more members. The team is already at maximum capacity."
        );
        return;
      }

      // Add user to team members
      const { error: memberError } = await supabase.from("teammembers").insert({
        team_id: teamId,
        user_id: request.user_id,
        role: "member",
      });

      if (memberError) {
        alert("Error adding member to team.");
        return;
      }
    }

    // Update request status
    const { error: requestError } = await supabase
      .from("teamjoinrequest")
      .update({ status })
      .eq("id", requestId);

    if (requestError) {
      alert("Error updating request status.");
      return;
    }

    // Refresh data
    fetchTeamDetails();
  };

  const handleLeaveTeam = async () => {
    if (!currentUser) return;

    // Check if user is the only leader
    if (isTeamLeader) {
      const leaders = members.filter((member) => member.role === "leader");
      if (leaders.length === 1) {
        alert(
          "You cannot leave the team as you are the only leader. Please promote another member to leader first or delete the team."
        );
        return;
      }
    }

    const confirmed = window.confirm(
      "Are you sure you want to leave this team?"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("teammembers")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", currentUser.id);

    if (error) {
      alert("Error leaving team: " + error.message);
    } else {
      router.push("/teams");
    }
  };

  const handleDeleteTeam = async () => {
    if (!isTeamLeader) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this team? This action cannot be undone."
    );
    if (!confirmed) return;

    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) {
      alert("Error deleting team: " + error.message);
    } else {
      router.push("/teams");
    }
  };

  const handleChangeMemberRole = async (
    memberId: string,
    newRole: "leader" | "member"
  ) => {
    if (!isTeamLeader) return;

    const { error } = await supabase
      .from("teammembers")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      alert("Error updating member role: " + error.message);
    } else {
      fetchTeamDetails();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isTeamLeader) return;

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    // Prevent removing yourself - use Leave Team instead
    if (member.user_id === currentUser?.id) {
      alert("You cannot remove yourself. Use the 'Leave Team' option instead.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.user.name} from the team?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("teammembers")
      .delete()
      .eq("id", memberId);

    if (error) {
      alert("Error removing member: " + error.message);
    } else {
      fetchTeamDetails();
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);

    // Reset form data to current team values
    if (team) {
      setEditFormData({
        name: team.name,
        description: team.description || "",
        isOpen: team.is_open,
        skills: team.skills_needed || [],
        currentSkill: "",
      });
    }
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addSkill = () => {
    if (
      editFormData.currentSkill.trim() &&
      !editFormData.skills.includes(editFormData.currentSkill.trim())
    ) {
      setEditFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.currentSkill.trim()],
        currentSkill: "",
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSaveTeam = async () => {
    if (!team) return;

    const { error } = await supabase
      .from("teams")
      .update({
        name: editFormData.name,
        description: editFormData.description,
        is_open: editFormData.isOpen,
        skills_needed:
          editFormData.skills.length > 0 ? editFormData.skills : null,
      })
      .eq("id", team.id);

    if (error) {
      alert("Error updating team: " + error.message);
    } else {
      fetchTeamDetails();
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!team || !event) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Team not found</h1>
        <Link href="/teams" className="text-blue-600 hover:underline">
          Return to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Link
          href={`/teams?eventId=${event.id}`}
          className="text-blue-600 hover:underline"
        >
          &larr; Back to Teams
        </Link>
      </div>

      {/* Team Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Team Name:
              </label>
              <input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description:
              </label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                className="w-full p-2 border rounded h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Skills Needed:
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="currentSkill"
                  value={editFormData.currentSkill}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded-l"
                  placeholder="Add a skill"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {editFormData.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editFormData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-800 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isOpen"
                name="isOpen"
                checked={editFormData.isOpen}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    isOpen: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isOpen" className="ml-2 text-sm">
                Open to Join Requests
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={toggleEditMode}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
                <p className="text-gray-500 mb-4">Event: {event.title}</p>

                {team.description && (
                  <p className="text-gray-700 mb-4">{team.description}</p>
                )}

                {team.skills_needed && team.skills_needed.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">
                      Skills Needed:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {team.skills_needed.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded ${
                      team.is_open
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {team.is_open ? "Open to Join" : "Closed"}
                  </span>
                  <span>
                    {members.length}/{team.max_members} Members
                  </span>
                </div>
              </div>

              {isTeamLeader && (
                <div className="flex gap-2">
                  <button
                    onClick={toggleEditMode}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit Team
                  </button>
                  <button
                    onClick={handleDeleteTeam}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete Team
                  </button>
                </div>
              )}

              {isTeamMember && !isTeamLeader && (
                <button
                  onClick={handleLeaveTeam}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Leave Team
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Team Members</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="border rounded-lg p-4 flex items-start"
            >
              <div className="mr-3">
                {member.user.profile_pic ? (
                  <Image
                    src={member.user.profile_pic}
                    alt={member.user.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-lg">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{member.user.name}</h3>
                    <p className="text-sm text-gray-500">
                      {member.role === "leader" ? "Team Leader" : "Member"}
                    </p>
                    {member.user.dept && member.user.year && (
                      <p className="text-xs text-gray-500">
                        {member.user.dept}, Year {member.user.year}
                      </p>
                    )}
                  </div>

                  {isTeamLeader && currentUser?.id !== member.user_id && (
                    <div className="ml-2">
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() =>
                          handleChangeMemberRole(
                            member.id,
                            member.role === "leader" ? "member" : "leader"
                          )
                        }
                      >
                        {member.role === "leader" ? "Demote" : "Promote"}
                      </button>
                      <button
                        className="block text-sm text-red-600 hover:underline mt-1"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {member.user.skills && member.user.skills.length > 3 && (
                  <span className="text-xs text-gray-500 px-1">
                    +{member.user.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Join Requests - Only visible to team leaders */}

        {isTeamLeader && joinRequests.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Join Requests</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 flex items-start"
                >
                  <div className="mr-3">
                    {request.user.profile_pic ? (
                      <Image
                        src={request.user.profile_pic}
                        alt={request.user.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-lg">
                          {request.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{request.user.name}</h3>
                        <p className="text-xs text-gray-500">
                          Requested:{" "}
                          {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                        {request.user.dept && request.user.year && (
                          <p className="text-xs text-gray-500">
                            {request.user.dept}, Year {request.user.year}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.user.skills && request.user.skills.length > 0 && (
                      <div className="mt-2 mb-3">
                        <div className="flex flex-wrap gap-1">
                          {request.user.skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {request.user.skills.length > 5 && (
                            <span className="text-xs text-gray-500 px-1">
                              +{request.user.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() =>
                          handleRequestAction(request.id, "accepted")
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        disabled={members.length >= (team?.max_members || 0)}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          handleRequestAction(request.id, "rejected")
                        }
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Event Information</h2>

          <div className="mb-4">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            {event.description && (
              <p className="text-gray-700 mt-2">{event.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold">Starts</h4>
              <p>{new Date(event.start_datetime).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Ends</h4>
              <p>{new Date(event.end_datetime).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4">
            <Link
              href={`/events/${event.id}`}
              className="text-blue-600 hover:underline"
            >
              View full event details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
