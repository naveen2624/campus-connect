"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function CreateClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

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

      // Only admins can create clubs
      if (userData?.user_type !== "admin") {
        router.push("/clubs");
      }
    } else {
      // Redirect if not logged in
      router.push("/login");
    }

    setLoading(false);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
    if (!formData.name.trim()) errors.name = "Club name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      // Create club
      const { data: clubData, error: clubError } = await supabase
        .from("clubs")
        .insert({
          name: formData.name,
          description: formData.description,
          created_by: currentUser.id,
          logo_url: formData.logo_url,
        })
        .select()
        .single();

      if (clubError) throw clubError;

      // Add creator as club admin
      await supabase.from("clubmembers").insert({
        club_id: clubData.id,
        user_id: currentUser.id,
        role: "admin",
      });

      // Redirect to club page
      router.push(`/clubs/${clubData.id}`);
    } catch (error) {
      console.error("Error creating club:", error);
      alert("Failed to create club. Please try again.");
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

  // If user is not an admin
  if (currentUser?.user_type !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">Only administrators can create clubs.</p>
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

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create New Club</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Club Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter club name"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe what your club is about"
            ></textarea>
          </div>

          <div className="mb-6">
            <label
              htmlFor="logo_url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Logo URL
            </label>
            <input
              type="text"
              id="logo_url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://example.com/logo.png"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL for your club's logo image (optional)
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline-block animate-spin h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                "Create Club"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
