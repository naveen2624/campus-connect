// app/dashboard/events/participants/[eventId]/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  UserCheck,
  Users,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function EventParticipants() {
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  const { eventId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading && eventId) {
      fetchEventDetails();
      fetchParticipants();
    }
  }, [user, authLoading, eventId]);

  async function fetchEventDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setEvent(data);

      // Check if current user is the event organizer
      setIsOrganizer(data.created_by === user.id);
    } catch (error) {
      console.error("Error fetching event details:", error.message);
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  }

  async function fetchParticipants() {
    try {
      const { data, error } = await supabase
        .from("eventregistration")
        .select(
          `
          id,
          status,
          registered_at,
          users (
            id,
            name,
            email,
            user_type,
            dept,
            year
          )
        `
        )
        .eq("event_id", eventId);

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error.message);
      setError("Failed to load participants");
    }
  }

  function goBack() {
    router.push(`/events/register/${eventId}`);
  }

  async function markAttendance(registrationId) {
    try {
      const { error } = await supabase
        .from("eventregistration")
        .update({ status: "attended" })
        .eq("id", registrationId);

      if (error) throw error;

      // Refresh participants list
      fetchParticipants();
    } catch (error) {
      console.error("Error marking attendance:", error.message);
      alert("Failed to mark attendance");
    }
  }

  function downloadParticipantsList() {
    // Function to export participants data as CSV
    const headers = [
      "Name",
      "Email",
      "Type",
      "Department",
      "Year",
      "Status",
      "Registered At",
    ];
    const csvData = participants.map((p) => [
      p.users.name,
      p.users.email,
      p.users.user_type,
      p.users.dept || "-",
      p.users.year || "-",
      p.status,
      new Date(p.registered_at).toLocaleString(),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${event?.title || "event"}-participants.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredParticipants = participants.filter(
    (p) =>
      p.users.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.users.dept &&
        p.users.dept.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/events")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Only allow event organizers to view participants
  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-4">
            Only event organizers can view participant lists.
          </p>
          <button
            onClick={goBack}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700 py-8 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center text-white opacity-80 hover:opacity-100 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event
          </button>
          <h1 className="text-3xl font-bold text-white">Event Participants</h1>
          <p className="text-purple-100 mt-2">
            {event?.title} - {participants.length} registered participants
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search participants..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
            </div>

            <button
              onClick={downloadParticipantsList}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200 w-full sm:w-auto justify-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Participants Table */}
          <div className="overflow-x-auto">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                  No participants found
                </h3>
                {searchQuery ? (
                  <p className="text-gray-500">Try adjusting your search</p>
                ) : (
                  <p className="text-gray-500">
                    No one has registered for this event yet
                  </p>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {registration.users.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.users.user_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.users.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.users.dept || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.users.year || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            registration.status === "attended"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {registration.status === "attended"
                            ? "Attended"
                            : "Registered"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {registration.status === "registered" ? (
                          <button
                            onClick={() => markAttendance(registration.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Mark as Attended
                          </button>
                        ) : (
                          <span className="text-green-600 flex items-center justify-end">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Attendance Marked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
