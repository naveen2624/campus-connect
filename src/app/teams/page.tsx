"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@supabase/supabase-js";

// Types based on schema
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
  event?: Event;
  members?: TeamMember[];
  member_count?: number;
};

type Event = {
  id: string;
  title: string;
  type: string;
  start_datetime: string;
  end_datetime: string;
};

type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: "leader" | "member";
  joined_at: string;
  user?: User;
};

type User = {
  id: string;
  name: string;
  profile_pic?: string;
  dept?: string;
  year?: number;
  skills?: string[];
};

export default function TeamsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  useEffect(() => {
    if (eventId) {
      setSelectedEvent(eventId);
    }

    fetchCurrentUser();
    fetchEvents();
  }, [eventId]);

  useEffect(() => {
    if (selectedEvent) {
      fetchTeams();
      if (user) {
        fetchMyTeams();
        fetchMyJoinRequests();
      }
    }
  }, [selectedEvent, user]);

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
        setUser(data);
      }
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_team_based", true)
      .order("start_datetime", { ascending: false });

    if (data) {
      setEvents(data);
    }

    setLoading(false);
  };

  const fetchTeams = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        events:event_id(*),
        members:teammembers(
          *,
          user:user_id(id, name, profile_pic, dept, year, skills)
        ),
        member_count:teammembers(count)
      `
      )
      .eq("event_id", selectedEvent);

    if (data) {
      setTeams(data);
    }

    setLoading(false);
  };

  const fetchMyTeams = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("teammembers")
      .select(
        `
        team:team_id(
          *,
          events:event_id(*),
          members:teammembers(
            *,
            user:user_id(id, name, profile_pic, dept, year, skills)
          ),
          member_count:teammembers(count)
        )
      `
      )
      .eq("user_id", user.id)
      .eq("team.event_id", selectedEvent);

    if (data && data.length > 0) {
      setMyTeams(data.map((item) => item.team));
    } else {
      setMyTeams([]);
    }
  };

  const fetchMyJoinRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("teamjoinrequest")
      .select(
        `
        *,
        team:team_id(*)
      `
      )
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("team.event_id", selectedEvent);

    if (data) {
      setJoinRequests(data);
    }
  };

  const handleJoinRequest = async (teamId: string) => {
    if (!user) {
      router.push("/login?redirect=/teams?eventId=" + selectedEvent);
      return;
    }

    // Check if already a member of a team for this event
    if (myTeams.length > 0) {
      alert("You are already a member of a team for this event.");
      return;
    }

    // Check if already sent a request
    const alreadyRequested = joinRequests.some((req) => req.team_id === teamId);
    if (alreadyRequested) {
      alert("You have already sent a request to join this team.");
      return;
    }

    const { data, error } = await supabase
      .from("teamjoinrequest")
      .insert([{ team_id: teamId, user_id: user.id }]);

    if (error) {
      alert("Error sending join request: " + error.message);
    } else {
      alert("Join request sent successfully!");
      fetchMyJoinRequests();
    }
  };

  const createNewTeam = () => {
    if (!user) {
      router.push("/login?redirect=/teams?eventId=" + selectedEvent);
      return;
    }

    router.push(`/teams/create?eventId=${selectedEvent}`);
  };

  const getFilteredTeams = () => {
    return teams.filter((team) => {
      // Filter by status (open/closed)
      if (statusFilter === "open" && !team.is_open) return false;
      if (statusFilter === "closed" && team.is_open) return false;

      // Filter by skills needed
      if (skillFilter && team.skills_needed) {
        return team.skills_needed.some((skill) =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        );
      }

      return true;
    });
  };

  const isTeamMember = (teamId: string) => {
    return myTeams.some((team) => team.id === teamId);
  };

  const hasJoinRequest = (teamId: string) => {
    return joinRequests.some((req) => req.team_id === teamId);
  };

  if (loading && !events.length) {
    return (
      <div className="container mx-auto p-6">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mt-2 mb-8 bg-gradient-to-br from-blue-800 to-purple-500 text-white p-6 rounded-lg shadow-md h-40 flex items-center justify-center">
        <h1 className="text-3xl font-bold mb-6">Team Management</h1>
      </header>
      {/* Event Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Select Event:</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="">-- Select a team-based event --</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} (
              {new Date(event.start_datetime).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          {/* My Teams Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Teams</h2>
              <button
                onClick={createNewTeam}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create New Team
              </button>
            </div>

            {myTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTeams.map((team) => (
                  <div
                    key={team.id}
                    className="border rounded-lg p-4 shadow  bg-blue-300/50"
                  >
                    <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                    <p className="text-gray-600 mb-4">{team.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        {team.member_count?.count || 0}/{team.max_members}{" "}
                        members
                      </span>
                      <Link
                        href={`/teams/${team.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Manage Team
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>You haven't joined any teams for this event yet.</p>
            )}

            {/* Join Requests */}
            {joinRequests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">Pending Requests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {joinRequests.map((req) => (
                    <div key={req.id} className="border rounded p-3 bg-gray-50">
                      <p>Request to join {req.team.name}</p>
                      <p className="text-sm text-gray-500">
                        Status: {req.status} - Sent{" "}
                        {new Date(req.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Team Discovery Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Discover Teams</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium mb-1">
                  Status:
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Teams</option>
                  <option value="open">Open Teams</option>
                  <option value="closed">Closed Teams</option>
                </select>
              </div>

              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium mb-1">Skill:</label>
                <input
                  type="text"
                  placeholder="Filter by skill (e.g. React, Python)"
                  className="w-full p-2 border rounded"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Teams List */}
            {getFilteredTeams().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredTeams().map((team) => (
                  <div
                    key={team.id}
                    className="border rounded-lg p-4 shadow  bg-purple-300/50"
                  >
                    <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                    <p className="text-gray-600 mb-4">{team.description}</p>

                    {team.skills_needed && team.skills_needed.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold mb-1">
                          Skills Needed:
                        </h4>
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

                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        {team.member_count?.count || 0}/{team.max_members}{" "}
                        members
                      </span>

                      {isTeamMember(team.id) ? (
                        <Link
                          href={`/teams/${team.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Team
                        </Link>
                      ) : hasJoinRequest(team.id) ? (
                        <span className="text-amber-600">Request Pending</span>
                      ) : team.is_open ? (
                        <button
                          onClick={() => handleJoinRequest(team.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          disabled={!team.is_open}
                        >
                          Join Team
                        </button>
                      ) : (
                        <span className="text-gray-500">Closed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No teams found matching your criteria.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
