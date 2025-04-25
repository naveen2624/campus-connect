"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Calendar,
  Users,
  Clock,
  ExternalLink,
  MapPin,
} from "lucide-react";

export default function ClubDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    if (id) {
      fetchClubData();
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

      // Check if user is already a member and their role
      const { data: memberData } = await supabase
        .from("clubmembers")
        .select("role")
        .eq("club_id", id)
        .eq("user_id", user.id)
        .single();

      if (memberData) {
        setUserRole(memberData.role);
      } else {
        // Check if user has a pending join request
        const { data: requestData } = await supabase
          .from("clubjoinrequests")
          .select("status")
          .eq("club_id", id)
          .eq("user_id", user.id)
          .single();

        if (requestData) {
          setJoinRequestStatus(requestData.status);
        }
      }

      // If user is an admin, fetch pending join requests
      if (memberData?.role === "admin") {
        fetchPendingRequests();
      }
    }
  }

  async function fetchPendingRequests() {
    try {
      const { data, error } = await supabase
        .from("clubjoinrequests")
        .select(
          `
            id,
            status,
            user_id,
            club_id,
            users:user_id (
              id,
              name,
              email,
              profile_pic
            )
          `
        )
        .eq("club_id", id)
        .eq("status", "pending");

      if (error) throw error;

      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error.message || error);
      setPendingRequests([]); // Optional: clear if error
    }
  }

  async function fetchClubData() {
    try {
      setLoading(true);

      // Fetch club details
      const { data: clubData, error: clubError } = await supabase
        .from("clubs")
        .select(
          `
          *,
          users:created_by(name, profile_pic)
        `
        )
        .eq("id", id)
        .single();

      if (clubError) throw clubError;
      setClub(clubData);

      // Fetch club events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", clubData.created_by)
        .order("start_datetime", { ascending: true });

      setEvents(eventsData || []);

      // Fetch club members
      const { data: membersData } = await supabase
        .from("clubmembers")
        .select(
          `
          *,
          users:user_id(id, name, email, profile_pic)
        `
        )
        .eq("club_id", id);

      setMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching club data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRequest() {
    try {
      const { error } = await supabase.from("clubjoinrequests").insert({
        club_id: id,
        user_id: currentUser.id,
        status: "pending",
      });

      if (error) throw error;

      setJoinRequestStatus("pending");

      // Optional: Refresh UI data after sending request
      await fetchPendingRequests?.();
      await fetchClubData?.();
    } catch (error) {
      console.error("Error sending join request:", error.message || error);
    }
  }
  async function handleRequestAction(requestId, userId, action) {
    try {
      const status = action === "accept" ? "accepted" : "rejected";

      // Update request status
      await supabase
        .from("clubjoinrequests")
        .update({ status })
        .eq("id", requestId);

      if (action === "accept") {
        // Check if the user is already a member of the club
        const { data: existingMember, error: memberError } = await supabase
          .from("clubmembers")
          .select("*")
          .eq("club_id", id)
          .eq("user_id", userId)
          .single();

        if (memberError) {
          throw memberError;
        }

        // If no existing member, insert new membership
        if (!existingMember) {
          await supabase.from("clubmembers").insert({
            club_id: id,
            user_id: userId,
            role: "member",
          });
        }
      }

      // Refresh data
      fetchPendingRequests();
      fetchClubData();
    } catch (error) {
      console.error("Error processing request:", error.message || error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Club not found</h1>
        <p className="mb-6">
          The club you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/clubs" className="text-blue-600 hover:underline">
          Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/clubs"
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to Clubs
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 bg-blue-100">
          {club.logo_url ? (
            <Image
              src={club.logo_url}
              alt={club.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl font-bold text-blue-300">
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold mb-2 sm:mb-0">{club.name}</h1>

            {currentUser && !userRole && joinRequestStatus !== "pending" && (
              <button
                onClick={handleJoinRequest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Request to Join
              </button>
            )}

            {joinRequestStatus === "pending" && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md">
                Join Request Pending
              </span>
            )}

            {userRole === "member" && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md">
                Member
              </span>
            )}

            {userRole === "admin" && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md">
                Admin
              </span>
            )}
          </div>

          <div className="border-b mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("about")}
                className={`py-2 px-1 -mb-px font-medium ${
                  activeTab === "about"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`py-2 px-1 -mb-px font-medium ${
                  activeTab === "events"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`py-2 px-1 -mb-px font-medium ${
                  activeTab === "members"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Members
              </button>
              {userRole === "admin" && (
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`py-2 px-1 -mb-px font-medium flex items-center ${
                    activeTab === "requests"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {activeTab === "about" && (
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">
                {club.description || "No description available for this club."}
              </p>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Club Details</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <Users className="mr-2" size={18} />
                  <span>{members.length} Members</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="mr-2" size={18} />
                  <span>
                    Created {new Date(club.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Club Events</h2>
                {userRole && (
                  <Link
                    href={`/clubs/${id}/create-event`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-md"
                  >
                    Create Event
                  </Link>
                )}
              </div>

              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <Link href={`/events/${event.id}`} key={event.id}>
                      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-lg mb-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <Calendar className="mr-2" size={16} />
                          <span>
                            {new Date(
                              event.start_datetime
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(event.start_datetime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="mr-2" size={16} />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <p className="text-gray-700 line-clamp-2 mt-2">
                          {event.description || "No description available"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No events scheduled for this club yet.
                </p>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Club Members</h2>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                        {member.users?.profile_pic ? (
                          <Image
                            src={member.users.profile_pic}
                            alt={member.users.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                            {member.users?.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{member.users?.name}</p>
                        <p className="text-sm text-gray-500">
                          {member.users?.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        member.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "requests" && userRole === "admin" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Join Requests</h2>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 p-4 rounded-lg"
                    >
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                          {request.users?.profile_pic ? (
                            <Image
                              src={request.users.profile_pic}
                              alt={request.users.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                              {request.users?.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{request.users?.name}</p>
                          <p className="text-sm text-gray-500">
                            {request.users?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleRequestAction(
                              request.id,
                              request.user_id,
                              "accept"
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRequestAction(
                              request.id,
                              request.user_id,
                              "reject"
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No pending join requests.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
