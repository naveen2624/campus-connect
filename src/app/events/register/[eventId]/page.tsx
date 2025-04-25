// app/events/register/[eventId]/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  UserCheck,
} from "lucide-react";

export default function EventRegistration() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [error, setError] = useState(null);
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
      checkRegistrationStatus();
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
    } catch (error) {
      console.error("Error fetching event details:", error.message);
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  }

  async function checkRegistrationStatus() {
    try {
      const { data, error } = await supabase
        .from("eventregistration")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setRegistrationStatus(data.status);
      } else {
        setRegistrationStatus(null);
      }
    } catch (error) {
      console.error("Error checking registration status:", error.message);
    }
  }

  async function handleRegister() {
    try {
      setRegistering(true);

      const registration = {
        user_id: user.id,
        event_id: eventId,
        status: "registered",
      };

      const { error } = await supabase
        .from("eventregistration")
        .insert([registration]);

      if (error) throw error;

      setRegistrationStatus("registered");
    } catch (error) {
      console.error("Error registering for event:", error.message);
      setError("Failed to register for event");
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancelRegistration() {
    if (confirm("Are you sure you want to cancel your registration?")) {
      try {
        setRegistering(true);
        const { error } = await supabase
          .from("eventregistration")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);

        if (error) throw error;
        setRegistrationStatus(null);
      } catch (error) {
        console.error("Error cancelling registration:", error.message);
        setError("Failed to cancel registration");
      } finally {
        setRegistering(false);
      }
    }
  }
  const navigateToParticipants = (eventId) => {
    router.push(`/events/participants/${eventId}`);
  };
  function goBack() {
    router.push("/events");
  }

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
            onClick={goBack}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={goBack}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const eventPassed = new Date(event.end_datetime) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700 py-8 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center text-white opacity-80 hover:opacity-100 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Events
          </button>
          <h1 className="text-3xl font-bold text-white">Event Registration</h1>
          <p className="text-purple-100 mt-2">Register for {event.title}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Event Header */}
          <div className="relative">
            {event.poster_url ? (
              <div className="h-64 overflow-hidden">
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-indigo-500" />
              </div>
            )}

            <div className="absolute top-4 right-4 flex space-x-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  event.mode === "online"
                    ? "bg-green-100 text-green-700"
                    : event.mode === "offline"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {event.mode.toUpperCase()}
              </span>
              {event.is_team_based && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                  TEAM EVENT
                </span>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {event.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Event Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" />
                    <div>
                      <p className="font-medium text-gray-700">Date & Time</p>
                      <p className="text-gray-600">
                        {format(
                          new Date(event.start_datetime),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </p>
                      <p className="text-gray-600">
                        {format(new Date(event.start_datetime), "h:mm a")} -
                        {format(new Date(event.end_datetime), " h:mm a")}
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium text-gray-700">Location</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.is_team_based && (
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium text-gray-700">Team Size</p>
                        <p className="text-gray-600">
                          Maximum {event.max_team_size} people per team
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  About this Event
                </h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Registration Status */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col items-center text-center">
                {eventPassed ? (
                  <div>
                    <div className="bg-gray-100 rounded-full p-4 inline-block mb-4">
                      <Calendar className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Event has ended
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This event has already taken place.
                    </p>
                  </div>
                ) : registrationStatus === "registered" ? (
                  <div>
                    <div className="bg-green-100 rounded-full p-4 inline-block mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      You're registered
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You've successfully registered for this event.
                    </p>
                    <button
                      onClick={handleCancelRegistration}
                      disabled={registering}
                      className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center mx-auto transition-colors"
                    >
                      {registering ? (
                        <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                      ) : (
                        <X className="h-5 w-5 mr-2" />
                      )}
                      Cancel Registration
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-indigo-100 rounded-full p-4 inline-block mb-4">
                      <Calendar className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Register for this Event
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {event.is_team_based
                        ? "Join this team-based event and collaborate with others!"
                        : "Secure your spot for this event!"}
                    </p>
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center mx-auto transition-colors"
                    >
                      {registering ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      ) : (
                        <Check className="h-5 w-5 mr-2" />
                      )}
                      Register Now
                    </button>
                    <button
                      onClick={() => navigateToParticipants(event.id)}
                      className="px-6 py-2.5 mt-2 bg-indigo-600 rounded-lg font-medium flex items-center justify-center mx-auto transition-colors text-green-50 hover:text-blue-600 hover:bg-green-200 duration-200"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      View Participants
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
