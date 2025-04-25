// app/dashboard/events/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import {
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Clock,
  X,
  UserCheck,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

export default function EventsDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [currentEvent, setCurrentEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    mode: "offline",
    is_team_based: false,
    poster_url: "",
    max_team_size: 1,
    created_by: null,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const [filter, setFilter] = useState("all");
  const { user, loading: authLoading, signOut } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchEvents();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { data, error } = await supabase.storage
      .from("event-posters")
      .upload(filePath, file);

    if (error) {
      console.error("Upload failed:", error.message);
      alert("Upload failed. Try again.");
      return;
    }

    const { publicUrl } = supabase.storage
      .from("event-posters")
      .getPublicUrl(filePath);

    // Update the formData
    setFormData((prev) => ({
      ...prev,
      poster_url: publicUrl,
    }));
  };
  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_datetime", { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      start_datetime: "",
      end_datetime: "",
      location: "",
      mode: "offline",
      is_team_based: false,
      poster_url: "",
      max_team_size: 1,
      created_by: user.id, // Set the current user's ID
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      type: event.type || "",
      start_datetime: event.start_datetime
        ? new Date(event.start_datetime).toISOString().slice(0, 16)
        : "",
      end_datetime: event.end_datetime
        ? new Date(event.end_datetime).toISOString().slice(0, 16)
        : "",
      location: event.location || "",
      mode: event.mode || "offline",
      is_team_based: event.is_team_based || false,
      poster_url: event.poster_url || "",
      max_team_size: event.max_team_size || 1,
      created_by: event.created_by || user.id, // Keep the original creator or set current user
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEvent(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Make sure created_by is set
      const eventData = {
        ...formData,
        created_by: user.id,
      };

      if (modalMode === "create") {
        const { error } = await supabase.from("events").insert([eventData]);
        if (error) throw error;
      } else {
        // For updates, we don't want to change the created_by field
        const { error } = await supabase
          .from("events")
          .update(formData)
          .eq("id", currentEvent.id);
        if (error) throw error;
      }

      fetchEvents();
      closeModal();
    } catch (error) {
      console.error("Error saving event:", error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        const { error } = await supabase.from("events").delete().eq("id", id);
        if (error) throw error;
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error.message);
      }
    }
  };

  const navigateToRegistration = (eventId) => {
    router.push(`/events/register/${eventId}`);
  };

  const filteredEvents = events.filter((event) => {
    // Filter based on search query
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description &&
        event.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter based on event mode
    const matchesFilter =
      filter === "all" ||
      (filter === "upcoming" && new Date(event.start_datetime) > new Date()) ||
      (filter === "past" && new Date(event.end_datetime) < new Date()) ||
      event.mode === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="mb-8 bg-gradient-to-br from-blue-800 to-purple-500 text-white p-6 rounded-lg shadow-md h-40 flex items-center justify-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Event Dashboard</h1>
          <p className="text-purple-100 mt-2">
            Manage all your campus events in one place
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="w-full sm:w-auto flex space-x-4">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <input
                type="text"
                placeholder="Search events..."
                className="pl-4 pr-10 py-2 border rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <select
              className="border rounded-lg px-4 py-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">
              No events found
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              {searchQuery || filter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first event"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                {event.poster_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-indigo-500" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex mb-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
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
                      <span className="ml-2 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        TEAM EVENT
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-800 line-clamp-1">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {format(
                          new Date(event.start_datetime),
                          "MMM d, yyyy h:mm a"
                        )}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.is_team_based && event.max_team_size && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Max team size: {event.max_team_size}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigateToRegistration(event.id)}
                      className="flex-1 flex items-center justify-center py-2 text-green-600 hover:bg-green-50 rounded transition duration-200"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Register
                    </button>
                    <button
                      onClick={() => openEditModal(event)}
                      className="flex-1 flex items-center justify-center py-2 text-indigo-600 hover:bg-indigo-50 rounded transition duration-200"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 flex items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded transition duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === "create" ? "Create New Event" : "Edit Event"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type*
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    placeholder="Workshop, Conference, Hackathon, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode*
                  </label>
                  <select
                    name="mode"
                    value={formData.mode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time*
                  </label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    value={formData.start_datetime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time*
                  </label>
                  <input
                    type="datetime-local"
                    name="end_datetime"
                    value={formData.end_datetime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Venue or virtual link"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Poster
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    name="is_team_based"
                    id="is_team_based"
                    checked={formData.is_team_based}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_team_based"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    This is a team-based event
                  </label>
                </div>

                {formData.is_team_based && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Team Size
                    </label>
                    <input
                      type="number"
                      name="max_team_size"
                      value={formData.max_team_size}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Hidden field for created_by */}
                <input type="hidden" name="created_by" value={user.id} />
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {modalMode === "create" ? "Create Event" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
