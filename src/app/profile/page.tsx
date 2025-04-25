// UserProfile.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";

// Define TypeScript interface for user data
interface User {
  id: string;
  name: string;
  email: string;
  user_type: "student" | "faculty" | "admin";
  profile_pic: string | null;
  bio: string | null;
  skills: string[] | null;
  resume_link: string | null;
  dept: string | null;
  year: number | null;
  created_at: string;
}

const UserProfile = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [skills, setSkills] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the authenticated user from Supabase Auth
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/login");
          return;
        }

        // Get user profile data from the database
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;

        setUser(data);
        setFormData(data);
        setSkills(data.skills ? data.skills.join(", ") : "");
        if (data.profile_pic) {
          setImagePreviewUrl(data.profile_pic);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle profile picture upload with direct Supabase storage URL
  const handleProfilePicUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);
      setError(null);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];

      // Create a local preview for immediate feedback
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);

      // Create a unique file path for storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${user?.id}/${fileName}`;

      // Upload file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from("user-profile")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });
      if (data) {
        console.log("File uploaded successfully:", data);
      }
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL using the returned path
      const { data: urlData } = supabase.storage
        .from("user-profile")
        .getPublicUrl(filePath);

      // Store the URL to be saved with the form submission
      setFormData({
        ...formData,
        profile_pic: urlData.publicUrl,
      });

      setSuccess("Image uploaded. Save changes to update your profile.");

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      setError(
        `Error uploading profile picture: ${
          error.message || JSON.stringify(error)
        }`
      );

      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission - use a special RPC call to update the user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Parse skills from comma-separated string to array
      const skillsArray = skills
        ? skills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill !== "")
        : [];

      // Prepare the update data
      const updates = {
        ...formData,
        skills: skillsArray,
      };

      // Call a Supabase RPC (stored procedure) to update the user profile
      // You will need to create this function in Supabase
      const { data, error } = await supabase.rpc("update_user_profile", {
        user_id: user?.id,
        user_data: updates,
      });

      if (error) {
        // If the RPC doesn't exist or fails, fall back to regular update
        console.warn("RPC update failed, trying direct update:", error);

        const { error: updateError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user?.id);

        if (updateError) throw updateError;
      }

      // Update local user state
      setUser({ ...user, ...updates } as User);
      setEditing(false);
      setSuccess("Profile updated successfully");

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(
        `Error updating profile: ${error.message || JSON.stringify(error)}`
      );

      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white shadow rounded-lg p-6">
        {/* Header with profile pic */}
        <div className="flex flex-col md:flex-row items-center mb-6 gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
              {editing && imagePreviewUrl ? (
                // In edit mode with a preview URL (either existing or newly uploaded)
                <img
                  src={imagePreviewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : user?.profile_pic ? (
                // In view mode with existing profile pic
                <img
                  src={user.profile_pic}
                  alt={`${user.name}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                // No profile pic
                <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {editing && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {user?.user_type}
              </span>
              {user?.dept && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 ml-2">
                  {user.dept}
                </span>
              )}
            </div>
          </div>

          <div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditing(false);
                  // Reset form data and image preview when canceling
                  setFormData(user || {});
                  setSkills(user?.skills ? user.skills.join(", ") : "");
                  setImagePreviewUrl(user?.profile_pic || null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {editing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="dept"
                  value={formData.dept || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {user?.user_type === "student" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="5"
                  />
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="JavaScript, React, Node.js"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume Link
                </label>
                <input
                  type="url"
                  name="resume_link"
                  value={formData.resume_link || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/resume.pdf"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* View Profile */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Department
                </h3>
                <p className="mt-1 text-lg">{user?.dept || "Not specified"}</p>
              </div>

              {user?.user_type === "student" && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year</h3>
                  <p className="mt-1 text-lg">
                    {user?.year || "Not specified"}
                  </p>
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                <p className="mt-1">{user?.bio || "No bio provided"}</p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Skills</h3>
                {user?.skills && user.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1">No skills listed</p>
                )}
              </div>

              {user?.resume_link && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Resume</h3>
                  <a
                    href={user.resume_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Resume
                  </a>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Member Since
                </h3>
                <p className="mt-1">
                  {new Date(user?.created_at || "").toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
