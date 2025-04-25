"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Globe,
  User,
  UserPlus,
} from "lucide-react";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [teams, setTeams] = useState([]);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    description: "",
    skills_needed: [],
    max_members: 4,
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (id) {
      fetchEventData();
      checkCurrentUser();
    }
  }, [id]);

  async function checkCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(data);

      // Check if user is registered for this event
      const { data: regData } = await supabase
        .from("eventregistration")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .single();

      if (regData) {
        setIsRegistered(true);
      }

      // Check if user is already in a team for this event
      const { data: teamMemberData } = await supabase
        .from("teammembers")
        .select("*")
        .eq("user_id", user.id)
        .in(
          "team_id",
          teams.map((team) => team.id)
        );

      if (teamMemberData && teamMemberData.length > 0) {
        setIsTeamMember(true);
      }
    }
  }

  async function fetchEventData() {
    try {
      setLoading(true);

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch organizer details
      if (eventData.created_by) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", eventData.created_by)
          .single();

        setOrganizer(userData);
      }

      // Fetch teams for this event
      if (eventData.is_team_based) {
        const { data: teamsData } = await supabase
          .from("teams")
          .select(
            `
            *,
            users:created_by(name, profile_pic),
            member_count:teammembers(count)
          `
          )
          .eq("event_id", id)
          .order("created_at", { ascending: false });

        setTeams(teamsData || []);
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      setRegistering(true);

      const { error } = await supabase.from("eventregistration").insert({
        user_id: currentUser.id,
        event_id: id,
        status: "registered",
      });

      if (error) throw error;
      setIsRegistered(true);
    } catch (error) {
      console.error("Error registering for event:", error);
      alert("Failed to register. Please try again.");
    } finally {
      setRegistering(false);
    }
  }

  function handleTeamInputChange(e) {
    const { name, value } = e.target;
    setTeamFormData({
      ...teamFormData,
      [name]: value,
    });
  }

  function handleAddSkill() {
    if (
      skillInput.trim() &&
      !teamFormData.skills_needed.includes(skillInput.trim())
    ) {
      setTeamFormData({
        ...teamFormData,
        skills_needed: [...teamFormData.skills_needed, skillInput.trim()],
      });
      setSkillInput("");
    }
  }

  function handleRemoveSkill(skill) {
    setTeamFormData({
      ...teamFormData,
      skills_needed: teamFormData.skills_needed.filter((s) => s !== skill),
    });
  }

  async function handleCreateTeam(e) {
    e.preventDefault();

    if (!teamFormData.name.trim()) {
      alert("Please enter a team name");
      return;
    }

    try {
      const { data: teamData, error } = await supabase
        .from("teams")
        .insert({
          name: teamFormData.name,
          description: teamFormData.description,
          event_id: id,
          created_by: currentUser.id,
          skills_needed: teamFormData.skills_needed,
          max_members: teamFormData.max_members,
          is_open: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Add the creator as team leader
      await supabase.from("teammembers").insert({
        team_id: teamData.id,
        user_id: currentUser.id,
        role: "leader",
      });

      // Refresh teams and close form
      fetchEventData();
      setShowCreateTeamForm(false);
      setTeamFormData({
        name: "",
        description: "",
        skills_needed: [],
        max_members: 4,
      });
      setIsTeamMember(true);
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team. Please try again.");
    }
  }

  async function handleJoinTeam(teamId) {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      const { error } = await supabase.from("teamjoinrequest").insert({
        team_id: teamId,
        user_id: currentUser.id,
      });

      if (error) throw error;
      alert("Join request sent successfully!");
      fetchEventData();
    } catch (error) {
      console.error("Error sending join request:", error);
      alert("Failed to send join request. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <p className="mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/events" className="text-blue-600 hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  const isEventInFuture = new Date(event.start_datetime) > new Date();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/events"
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to Events
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {event.poster_url && (
          <div className="relative h-64 w-full">
            <Image
              src={event.poster_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold mb-2 sm:mb-0">{event.title}</h1>

            {isEventInFuture && currentUser && !isRegistered && (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                {registering ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2" size={18} />
                    Register
                  </>
                )}
              </button>
            )}

            {isRegistered && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md flex items-center">
                <User className="mr-2" size={16} />
                Registered
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="prose max-w-none mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {event.description ||
                    "No description available for this event."}
                </p>
              </div>

              {event.is_team_based && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Teams</h2>
                    {currentUser &&
                      isRegistered &&
                      !isTeamMember &&
                      isEventInFuture && (
                        <button
                          onClick={() =>
                            setShowCreateTeamForm(!showCreateTeamForm)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-md"
                        >
                          {showCreateTeamForm ? "Cancel" : "Create Team"}
                        </button>
                      )}
                  </div>

                  {showCreateTeamForm && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-medium mb-3">
                        Create New Team
                      </h3>
                      <form onSubmit={handleCreateTeam}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={teamFormData.name}
                            onChange={handleTeamInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={teamFormData.description}
                            onChange={handleTeamInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            rows={3}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skills Needed
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-l-md"
                              placeholder="Add skills required"
                            />
                            <button
                              type="button"
                              onClick={handleAddSkill}
                              className="bg-gray-200 px-3 py-2 rounded-r-md"
                            >
                              Add
                            </button>
                          </div>

                          {teamFormData.skills_needed.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {teamFormData.skills_needed.map(
                                (skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSkill(skill)}
                                      className="ml-1 text-blue-800 hover:text-blue-900"
                                    >
                                      ×
                                    </button>
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum Team Size
                          </label>
                          <input
                            type="number"
                            name="max_members"
                            value={teamFormData.max_members}
                            onChange={handleTeamInputChange}
                            min="1"
                            max={event.max_team_size || 10}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        >
                          Create Team
                        </button>
                      </form>
                    </div>
                  )}

                  {teams.length > 0 ? (
                    <div className="space-y-4">
                      {teams.map((team) => (
                        <div
                          key={team.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {team.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Team by {team.users?.name || "Unknown"}
                              </p>
                            </div>
                            {currentUser &&
                              isRegistered &&
                              !isTeamMember &&
                              team.is_open && (
                                <button
                                  onClick={() => handleJoinTeam(team.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-md"
                                >
                                  Request to Join
                                </button>
                              )}
                          </div>

                          {team.description && (
                            <p className="mt-2 text-gray-700">
                              {team.description}
                            </p>
                          )}

                          <div className="mt-3 flex justify-between items-center">
                            <div className="flex items-center text-gray-600">
                              <Users className="mr-1" size={16} />
                              <span className="text-sm">
                                {team.member_count.count} / {team.max_members}{" "}
                                members
                              </span>
                            </div>

                            {team.skills_needed &&
                              team.skills_needed.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {team.skills_needed.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      No teams have been created yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-3">Event Details</h2>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="mr-2 mt-1" size={18} />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-gray-600">
                        {new Date(event.start_datetime).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">
                        {new Date(event.start_datetime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(event.end_datetime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start">
                      <MapPin className="mr-2 mt-1" size={18} />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Globe className="mr-2 mt-1" size={18} />
                    <div>
                      <p className="font-medium">Mode</p>
                      <p className="text-gray-600 capitalize">{event.mode}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="mr-2 mt-1" size={18} />
                    <div>
                      <p className="font-medium">Event Type</p>
                      <p className="text-gray-600 capitalize">{event.type}</p>
                    </div>
                  </div>

                  {event.is_team_based && (
                    <div className="flex items-start">
                      <Users className="mr-2 mt-1" size={18} />
                      <div>
                        <p className="font-medium">Team-based Event</p>
                        <p className="text-gray-600">
                          Max team size:{" "}
                          {event.max_team_size || "Not specified"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {organizer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3">Organized by</h2>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                      {organizer.profile_pic ? (
                        <Image
                          src={organizer.profile_pic}
                          alt={organizer.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                          {organizer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{organizer.name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {organizer.user_type}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
