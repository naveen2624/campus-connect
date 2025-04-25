"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function CreateClubEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [club, setClub] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "workshop", // Default event type
    start_datetime: "",
    end_datetime: "",
    location: "",
    mode: "offline", // Default mode
    is_team_based: false,
    poster_url: "",
    max_team_size: 1,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    checkAuth();
    fetchClubData();
  }, [id]);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(userData);

      // Check if user is a club member and their role
      const { data: memberData } = await supabase
        .from("clubmembers")
        .select("role")
        .eq("club_id", id)
        .eq("user_id", user.id)
        .single();

      if (memberData) {
        setUserRole(memberData.role);
      } else {
        // Redirect if not a member
        router.push(`/clubs/${id}`);
      }
    } else {
      // Redirect if not logged in
      router.push("/login");
    }
  }

  async function fetchClubData() {
    try {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setClub(data);
    } catch (error) {
      console.error("Error fetching club:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.start_datetime)
      errors.start_datetime = "Start date/time is required";
    if (!formData.end_datetime)
      errors.end_datetime = "End date/time is required";
    if (new Date(formData.end_datetime) <= new Date(formData.start_datetime)) {
      errors.end_datetime = "End time must be after start time";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      // Create event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          start_datetime: formData.start_datetime,
          end_datetime: formData.end_datetime,
          location: formData.location,
          mode: formData.mode,
          is_team_based: formData.is_team_based,
          created_by: currentUser.id,
          poster_url: formData.poster_url,
          max_team_size: formData.is_team_based ? formData.max_team_size : null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Redirect to club page
      router.push(`/clubs/${id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  // If user is not a member or doesn't have permission
  if (!userRole) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">
          You need to be a member of this club to create events.
        </p>
        <Link href={`/clubs/${id}`} className="text-blue-600 hover:underline">
          Back to Club Page
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/clubs/${id}`}
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to {club?.name}
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Club Event</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="meetup">Meetup</option>
                <option value="conference">Conference</option>
                <option value="competition">Competition</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Mode
              </label>
              <select
                name="mode"
                value={formData.mode}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="offline">Offline</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date/Time *
              </label>
              <input
                type="datetime-local"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.start_datetime
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.start_datetime && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.start_datetime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date/Time *
              </label>
              <input
                type="datetime-local"
                name="end_datetime"
                value={formData.end_datetime}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.end_datetime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.end_datetime && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.end_datetime}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder={
                  formData.mode === "online" ? "Meeting link" : "Venue"
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poster URL
              </label>
              <input
                type="url"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_team_based"
                  name="is_team_based"
                  checked={formData.is_team_based}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_team_based"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Team-based Event
                </label>
              </div>
            </div>

            {formData.is_team_based && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Team Size
                </label>
                <input
                  type="number"
                  name="max_team_size"
                  value={formData.max_team_size}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href={`/clubs/${id}`}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md mr-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
