"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Your custom auth hook
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/SupabaseClient";

// Loading component
function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Enhanced card component for consistent styling
function DashboardCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 h-full border border-gray-100 ${className}`}
    >
      {children}
    </div>
  );
}

// Stats Card Component
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full ${color} flex items-center justify-center mr-4`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
        </div>
      </div>
    </div>
  );
}

// Component to fetch and display user's registered events
function RegisteredEvents({ userId }) {
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        setIsLoading(true);

        const { data, error: fetchError } = await supabase
          .from("eventregistration")
          .select(
            `
            id,
            status,
            registered_at,
            event_id,
            events (
              *
            )
          `
          )
          .eq("user_id", userId)
          .order("events.start_datetime", { ascending: true });

        if (fetchError) throw fetchError;
        setRegistrations(data || []);
      } catch (err) {
        console.error("Error fetching registered events:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegisteredEvents();
  }, [userId]); // assuming userId is a dependency

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Error loading events
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className="text-gray-500 py-8 text-center flex flex-col items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-300 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No registered events found</p>
        <Link
          href="/events"
          className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Browse events to register
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((reg) => {
        const eventDate = new Date(reg.events.start_datetime);
        const isUpcoming = eventDate > new Date();
        const formattedDate = eventDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const formattedTime = eventDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={reg.id}
            className={`border rounded-xl p-4 hover:shadow-md transition-all duration-300 ${
              isUpcoming ? "bg-gradient-to-r from-blue-50 to-white" : "bg-white"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2 text-center mr-4 w-14">
                <div className="text-xs font-semibold text-gray-500">
                  {eventDate.toLocaleDateString("en-US", { month: "short" })}
                </div>
                <div className="text-lg font-bold">{eventDate.getDate()}</div>
              </div>

              <div className="flex-grow">
                <h3 className="font-medium text-lg">{reg.events.title}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formattedTime}
                  <span className="mx-2">•</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {reg.events.location || reg.events.mode}
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    reg.status === "attended"
                      ? "bg-green-100 text-green-800"
                      : isUpcoming
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {reg.status === "attended"
                    ? "Attended"
                    : isUpcoming
                    ? "Registered"
                    : "Missed"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                {reg.events.type}
              </span>
              <Link
                href={`/events/${reg.events.id}`}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component to fetch and display user's job applications
function AppliedJobs({ userId }) {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("jobapplication")
          .select(
            `
            id,
            status,
            applied_at,
            jobs:job_id (
              id,
              title,
              type,
              location,
              company_id,
              salary,
              users:company_id (
                name
              )
            )
          `
          )
          .eq("applicant_id", userId)
          .order("applied_at", { ascending: false });

        if (fetchError) throw fetchError;
        setApplications(data || []);
      } catch (err) {
        console.error("Error fetching job applications:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchAppliedJobs();
    }
  }, [userId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Error loading job applications
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-gray-500 py-8 text-center flex flex-col items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-300 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p>No job applications found</p>
        <Link
          href="/jobs"
          className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Browse open positions
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "offered":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "reviewed":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-4">
      {applications.map((app) => {
        const appliedDate = new Date(app.applied_at);
        const formattedDate = appliedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={app.id}
            className="border rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-white"
          >
            <div className="flex items-start">
              <div className="flex-grow">
                <div className="flex items-center">
                  <h3 className="font-medium text-lg">{app.jobs.title}</h3>
                  <span
                    className={`ml-3 text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(
                      app.status
                    )}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 font-medium mt-1">
                  {app.jobs.users?.name || "Company"}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {app.jobs.location}
                  <span className="mx-2">•</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Applied on {formattedDate}
                </div>
              </div>

              {app.jobs.salary && (
                <div className="flex-shrink-0 ml-2">
                  <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                    {app.jobs.salary}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded-full capitalize">
                {app.jobs.type}
              </span>
              <Link
                href={`/jobs/${app.jobs.id}`}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View application
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component to fetch and display user's club memberships
function ClubMemberships({ userId }) {
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClubMemberships = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("clubmembers")
          .select(
            `
            id,
            role,
            joined_at,
            clubs:club_id (
              id,
              name,
              description,
              logo_url
            )
          `
          )
          .eq("user_id", userId);

        if (fetchError) throw fetchError;
        setMemberships(data || []);
      } catch (err) {
        console.error("Error fetching club memberships:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchClubMemberships();
    }
  }, [userId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Error loading clubs
      </div>
    );
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className="text-gray-500 py-8 text-center flex flex-col items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-300 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p>No club memberships found</p>
        <Link
          href="/clubs"
          className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Find clubs to join
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {memberships.map((membership) => (
        <div
          key={membership.id}
          className="border rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-white flex items-center"
        >
          <div className="flex-shrink-0 mr-4">
            {membership.clubs.logo_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
                <img
                  src={membership.clubs.logo_url}
                  alt={membership.clubs.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                <span className="text-blue-500 font-bold text-xl">
                  {membership.clubs.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-grow">
            <div className="flex items-center">
              <h3 className="font-medium text-lg">{membership.clubs.name}</h3>
              <span
                className={`ml-3 text-xs px-3 py-1 rounded-full font-medium ${
                  membership.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {membership.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
              {membership.clubs.description || "No description available"}
            </div>
          </div>

          <div className="flex-shrink-0 ml-4">
            <Link
              href={`/clubs/${membership.clubs.id}`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors text-gray-500 hover:text-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to fetch and display user's teams
function UserTeams({ userId }) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        setIsLoading(true);

        // Get teams the user is a member of
        const { data: teamMemberships, error: membershipError } = await supabase
          .from("teammembers")
          .select(
            `
            role,
            teams:team_id (
              id,
              name,
              description,
              event_id,
              is_open,
              events:event_id (
                title,
                start_datetime
              )
            )
          `
          )
          .eq("user_id", userId);

        if (membershipError) throw membershipError;

        // Get teams created by the user
        const { data: createdTeams, error: createdError } = await supabase
          .from("teams")
          .select(
            `
            id,
            name,
            description,
            event_id,
            is_open,
            events:event_id (
              title,
              start_datetime
            )
          `
          )
          .eq("created_by", userId);

        if (createdError) throw createdError;

        // Combine and deduplicate teams
        const allTeams = [...(teamMemberships || []), ...(createdTeams || [])];
        const uniqueTeamIds = new Set();
        const uniqueTeams = allTeams.filter((item) => {
          const team = "teams" in item ? item.teams : item;
          if (!team || uniqueTeamIds.has(team.id)) return false;
          uniqueTeamIds.add(team.id);
          return true;
        });

        setTeams(uniqueTeams);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserTeams();
    }
  }, [userId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Error loading teams
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="text-gray-500 py-8 text-center flex flex-col items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-300 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <p>No teams found</p>
        <Link
          href="/events"
          className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Find events to join teams
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((item) => {
        const team = "teams" in item ? item.teams : item;
        const teamEvent = team.events;
        const eventDate = teamEvent?.start_datetime
          ? new Date(teamEvent.start_datetime)
          : null;

        return (
          <div
            key={team.id}
            className="border rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-white"
          >
            <div className="flex items-start">
              <div className="flex-grow">
                <h3 className="font-medium text-lg">{team.name}</h3>
                {teamEvent && (
                  <div className="text-sm text-indigo-600 font-medium mt-1">
                    For: {teamEvent.title}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  {team.description || "No description available"}
                </div>
              </div>

              <div className="flex-shrink-0 ml-4">
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    team.is_open
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {team.is_open ? "Open" : "Closed"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              {eventDate ? (
                <div className="text-sm text-gray-500">
                  Event date: {eventDate.toLocaleDateString()}
                </div>
              ) : (
                <div></div>
              )}
              <Link
                href={`/teams/${team.id}`}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View team
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Main Dashboard component
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("events");
  const [stats, setStats] = useState({
    eventsCount: 0,
    jobsCount: 0,
    clubsCount: 0,
    teamsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        // Fetch event registrations count
        const { count: eventsCount, error: eventsError } = await supabase
          .from("eventregistration")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch job applications count
        const { count: jobsCount, error: jobsError } = await supabase
          .from("jobapplication")
          .select("id", { count: "exact", head: true })
          .eq("applicant_id", user.id);

        // Fetch club memberships count
        const { count: clubsCount, error: clubsError } = await supabase
          .from("clubmembers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch teams count (both created and joined)
        const { count: memberTeamsCount, error: memberTeamsError } =
          await supabase
            .from("teammembers")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

        const { count: createdTeamsCount, error: createdTeamsError } =
          await supabase
            .from("teams")
            .select("id", { count: "exact", head: true })
            .eq("created_by", user.id);

        if (eventsError)
          console.error("Error fetching events count:", eventsError);
        if (jobsError) console.error("Error fetching jobs count:", jobsError);
        if (clubsError)
          console.error("Error fetching clubs count:", clubsError);
        if (memberTeamsError)
          console.error("Error fetching member teams count:", memberTeamsError);
        if (createdTeamsError)
          console.error(
            "Error fetching created teams count:",
            createdTeamsError
          );

        setStats({
          eventsCount: eventsCount || 0,
          jobsCount: jobsCount || 0,
          clubsCount: clubsCount || 0,
          teamsCount: (memberTeamsCount || 0) + (createdTeamsCount || 0),
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Welcome back, {user.name || user.email}! Here's what's happening with
          your account.
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Events Registered"
          value={isLoading ? "..." : stats.eventsCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          color="bg-blue-50"
        />
        <StatCard
          title="Jobs Applied"
          value={isLoading ? "..." : stats.jobsCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          color="bg-green-50"
        />
        <StatCard
          title="Clubs Joined"
          value={isLoading ? "..." : stats.clubsCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          color="bg-purple-50"
        />
        <StatCard
          title="Teams"
          value={isLoading ? "..." : stats.teamsCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          color="bg-orange-50"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("events")}
            className={`${
              activeTab === "events"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`${
              activeTab === "jobs"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Job Applications
          </button>
          <button
            onClick={() => setActiveTab("clubs")}
            className={`${
              activeTab === "clubs"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Clubs
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`${
              activeTab === "teams"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Teams
          </button>
        </nav>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === "events" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Events</h2>
              <Link
                href="/events"
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all events
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <RegisteredEvents userId={user.id} />
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Your Job Applications
              </h2>
              <Link
                href="/jobs"
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all jobs
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <AppliedJobs userId={user.id} />
          </div>
        )}

        {activeTab === "clubs" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Your Club Memberships
              </h2>
              <Link
                href="/clubs"
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all clubs
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <ClubMemberships userId={user.id} />
          </div>
        )}

        {activeTab === "teams" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Teams</h2>
              <Link
                href="/teams"
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all teams
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <UserTeams userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
