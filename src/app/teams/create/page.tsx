"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

type Event = {
  id: string;
  title: string;
  type: string;
  max_team_size: number;
};

export default function CreateTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    skills: [] as string[],
    currentSkill: "",
    isOpen: true,
    maxMembers: 4,
  });

  useEffect(() => {
    if (!eventId) {
      router.push("/teams");
      return;
    }

    fetchCurrentUser();
    fetchEventDetails();
  }, [eventId]);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/teams/create?eventId=" + eventId);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setUser(data);
    } else {
      router.push("/login");
    }
  };

  const fetchEventDetails = async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("is_team_based", true)
      .single();

    if (data) {
      setEvent(data);
      if (data.max_team_size) {
        setFormData((prev) => ({
          ...prev,
          maxMembers: data.max_team_size,
        }));
      }
    } else {
      router.push("/teams");
    }

    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addSkill = () => {
    if (
      formData.currentSkill.trim() &&
      !formData.skills.includes(formData.currentSkill.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.currentSkill.trim()],
        currentSkill: "",
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId || !user) return;

    setSubmitting(true);

    try {
      // 1. Create the team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            name: formData.name,
            description: formData.description,
            event_id: eventId,
            created_by: user.id,
            skills_needed: formData.skills.length > 0 ? formData.skills : null,
            is_open: formData.isOpen,
            max_members: parseInt(formData.maxMembers.toString()),
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Add the creator as a team leader
      const { error: memberError } = await supabase.from("teammembers").insert([
        {
          team_id: teamData.id,
          user_id: user.id,
          role: "leader",
        },
      ]);

      if (memberError) throw memberError;

      // Success - redirect to the team page
      router.push(`/teams/${teamData.id}`);
    } catch (error: any) {
      alert("Error creating team: " + error.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create a New Team</h1>

      {event && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="text-xl font-semibold mb-2">Event: {event.title}</h2>
          <p className="text-gray-600">Type: {event.type}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Name */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Team Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            placeholder="Enter your team name"
          />
        </div>

        {/* Description */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="description"
          >
            Team Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded h-32"
            placeholder="Describe your team, goals, and what you're looking for in teammates"
          />
        </div>

        {/* Skills Needed */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="skills">
            Skills Needed
          </label>
          <div className="flex">
            <input
              type="text"
              id="currentSkill"
              name="currentSkill"
              value={formData.currentSkill}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-l"
              placeholder="E.g., React, Python, UI Design"
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {formData.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
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

        {/* Team Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Max Members */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="maxMembers"
            >
              Maximum Team Size *
            </label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              required
              min="2"
              max={event?.max_team_size || 10}
              value={formData.maxMembers}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Open/Closed */}
          <div className="flex items-center h-full pt-6">
            <input
              type="checkbox"
              id="isOpen"
              name="isOpen"
              checked={formData.isOpen}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isOpen: e.target.checked }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isOpen" className="ml-2 text-sm">
              Open to Join Requests
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {submitting ? "Creating..." : "Create Team"}
          </button>
        </div>
      </form>
    </div>
  );
}
