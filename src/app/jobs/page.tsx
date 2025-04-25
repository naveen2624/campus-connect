"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Save,
} from "lucide-react";

// Types based on your database schema
interface Job {
  id: string;
  title: string;
  company_id: string;
  company?: {
    name: string;
    profile_pic?: string;
  };
  description: string;
  type: "internship" | "full-time" | "part-time" | "contract";
  deadline: string;
  eligibility: string;
  location: string;
  salary: string;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_link: string;
  cover_letter?: string;
  status: "applied" | "reviewed" | "interview" | "offered" | "rejected";
  applied_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profile_pic?: string;
  bio?: string;
  user_type: "student" | "faculty" | "admin";
}

interface JobFormData {
  id?: string;
  title: string;
  description: string;
  type: "internship" | "full-time" | "part-time" | "contract";
  deadline: string;
  eligibility: string;
  location: string;
  salary: string;
}

export default function JobPortal() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<
    "jobs" | "company" | "myApplications" | "manageJobs" | "applicationReview"
  >("jobs");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormData, setJobFormData] = useState<JobFormData>({
    title: "",
    description: "",
    type: "full-time",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days from now
    eligibility: "",
    location: "",
    salary: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [applicationToReview, setApplicationToReview] = useState<string | null>(
    null
  );
  const [jobApplicants, setJobApplicants] = useState<any[]>([]);
  const [resumeLink, setResumeLink] = useState<string>("");

  const handleResumeLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeLink(e.target.value);
  };

  // Fetch current user
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.push("/auth/login");
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, email, profile_pic, bio, user_type")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to authenticate user. Please sign in again.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    }

    fetchCurrentUser();
  }, [router]);

  // Fetch jobs with company info
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("jobs")
          .select(
            `
            *,
            company:company_id (
              name,
              profile_pic
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setJobs(data || []);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  // Fetch user's job applications
  useEffect(() => {
    if (!user) return;

    async function fetchApplications() {
      try {
        const { data, error } = await supabase
          .from("jobapplication")
          .select("*")
          .eq("applicant_id", user!.id);

        if (error) {
          throw error;
        }

        setApplications(data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Failed to load your applications.");
      }
    }

    fetchApplications();
  }, [user]);
  // First, ensure your bucket exists and has the right permissions
  // This can be run once during app initialization or in a setup script
  async function setupStorageBucket() {
    // Create the bucket if it doesn't exist
    const { data, error } = await supabase.storage.createBucket(
      "job-applications",
      {
        public: false, // Set to true if you want files to be publicly accessible
      }
    );

    // Configure bucket permissions as needed
    // For example, to allow authenticated users to upload files:
    const { error: policyError } = await supabase.storage
      .from("job-applications")
      .createSignedUploadUrl("resumes"); // This creates a directory inside the bucket
  }

  // Filter jobs based on search query and job type
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = jobTypeFilter === "all" || job.type === jobTypeFilter;

    return matchesSearch && matchesType;
  });

  // Check if user can manage jobs
  const canManageJobs =
    user?.user_type === "faculty" || user?.user_type === "admin";

  // Get application status for a job
  const getApplicationStatus = (jobId: string) => {
    const application = applications.find((app) => app.job_id === jobId);
    return application?.status || null;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle company profile click
  const viewCompanyProfile = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) {
        throw error;
      }

      setSelectedCompany(data);
      setView("company");
    } catch (error) {
      console.error("Error fetching company:", error);
      setError("Failed to load company profile.");
    }
  };

  // Handle apply for job
  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  // Handle resume file selection

  // Handle application submission
  // Handle application submission with improved file upload
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedJob || !resumeLink) {
      setError("Missing required information. Please provide a resume link.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert application record using the provided resume link
      const { error: applicationError } = await supabase
        .from("jobapplication")
        .insert({
          job_id: selectedJob.id,
          applicant_id: user.id,
          resume_link: resumeLink,
          cover_letter: coverLetter,
          status: "applied",
          applied_at: new Date().toISOString(),
        });

      if (applicationError) {
        throw new Error("Failed to submit application");
      }

      // Refresh applications
      const { data: updatedApps } = await supabase
        .from("jobapplication")
        .select("*")
        .eq("applicant_id", user.id);

      setApplications(updatedApps || []);
      setShowApplyModal(false);
      setResumeLink(""); // Reset link input
      setCoverLetter("");
      setSuccess("Application submitted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Application submission error:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CRUD Operations for Faculty/Admin

  // Create new job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create a job.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: jobFormData.title,
          company_id: user.id,
          description: jobFormData.description,
          type: jobFormData.type,
          deadline: new Date(jobFormData.deadline).toISOString(),
          eligibility: jobFormData.eligibility,
          location: jobFormData.location,
          salary: jobFormData.salary,
        })
        .select("*, company:company_id(name, profile_pic)");

      if (error) {
        throw error;
      }

      setJobs([data[0], ...jobs]);
      setShowJobForm(false);
      resetJobForm();
      setSuccess("Job created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error creating job:", error);
      setError("Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing job
  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobFormData.id) {
      setError("Job ID is missing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("jobs")
        .update({
          title: jobFormData.title,
          description: jobFormData.description,
          type: jobFormData.type,
          deadline: new Date(jobFormData.deadline).toISOString(),
          eligibility: jobFormData.eligibility,
          location: jobFormData.location,
          salary: jobFormData.salary,
        })
        .eq("id", jobFormData.id)
        .select("*, company:company_id(name, profile_pic)");

      if (error) {
        throw error;
      }

      // Update jobs state
      setJobs(jobs.map((job) => (job.id === jobFormData.id ? data[0] : job)));
      setShowJobForm(false);
      resetJobForm();
      setSuccess("Job updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating job:", error);
      setError("Failed to update job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) {
        throw error;
      }

      // Update jobs state
      setJobs(jobs.filter((job) => job.id !== jobId));
      setSuccess("Job deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting job:", error);
      setError("Failed to delete job. Please try again.");
    }
  };

  // Handle job form input changes
  const handleJobFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setJobFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset job form
  const resetJobForm = () => {
    setJobFormData({
      title: "",
      description: "",
      type: "full-time",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      eligibility: "",
      location: "",
      salary: "",
    });
    setIsEditMode(false);
  };

  // Edit job
  const handleEditJob = (job: Job) => {
    setJobFormData({
      id: job.id,
      title: job.title,
      description: job.description,
      type: job.type,
      deadline: new Date(job.deadline).toISOString().split("T")[0],
      eligibility: job.eligibility || "",
      location: job.location || "",
      salary: job.salary || "",
    });
    setIsEditMode(true);
    setShowJobForm(true);
  };

  // Fetch applicants for a job
  const fetchJobApplicants = async (jobId: string) => {
    try {
      const { data: applications, error: appError } = await supabase
        .from("jobapplication")
        .select(
          `
          *,
          applicant:applicant_id(id, name, email, profile_pic)
        `
        )
        .eq("job_id", jobId);

      if (appError) {
        throw appError;
      }

      setJobApplicants(applications);
      setApplicationToReview(jobId);
      setView("applicationReview");
    } catch (error) {
      console.error("Error fetching applicants:", error);
      setError("Failed to load applicants.");
    }
  };

  // Update application status
  const updateApplicationStatus = async (
    applicationId: string,
    status: Application["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("jobapplication")
        .update({ status })
        .eq("id", applicationId);

      if (error) {
        throw error;
      }

      // Update local state
      setJobApplicants(
        jobApplicants.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );

      setSuccess(`Application status updated to ${status}!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating application status:", error);
      setError("Failed to update application status.");
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Application["status"] }) => {
    let badgeClass = "";
    let icon = null;

    switch (status) {
      case "applied":
        badgeClass = "bg-blue-100 text-blue-800";
        icon = <Clock size={14} className="mr-1" />;
        break;
      case "reviewed":
        badgeClass = "bg-purple-100 text-purple-800";
        icon = <FileText size={14} className="mr-1" />;
        break;
      case "interview":
        badgeClass = "bg-yellow-100 text-yellow-800";
        icon = <Calendar size={14} className="mr-1" />;
        break;
      case "offered":
        badgeClass = "bg-green-100 text-green-800";
        icon = <Check size={14} className="mr-1" />;
        break;
      case "rejected":
        badgeClass = "bg-red-100 text-red-800";
        icon = <X size={14} className="mr-1" />;
        break;
    }

    return (
      <span
        className={`flex items-center px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Job type badge component
  const JobTypeBadge = ({ type }: { type: Job["type"] }) => {
    let badgeClass = "";

    switch (type) {
      case "internship":
        badgeClass = "bg-green-100 text-green-800";
        break;
      case "full-time":
        badgeClass = "bg-blue-100 text-blue-800";
        break;
      case "part-time":
        badgeClass = "bg-purple-100 text-purple-800";
        break;
      case "contract":
        badgeClass = "bg-yellow-100 text-yellow-800";
        break;
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}
      >
        {type
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 bg-gradient-to-br from-blue-800 to-purple-500 text-white p-6 rounded-lg shadow-md h-40 flex items-center justify-center">
        <h1 className="text-3xl font-bold mb-2">Job & Internship Portal</h1>
      </header>
      <div className="flex flex-wrap gap-4 mb-10 justify-center">
        <button
          onClick={() => setView("jobs")}
          className={`px-4 py-2 rounded-md ${
            view === "jobs"
              ? "bg-blue-600 text-white cursor-pointer "
              : "bg-transparent border border-gray-200 cursor-pointer"
          }`}
        >
          Browse Jobs
        </button>
        <button
          onClick={() => setView("myApplications")}
          className={`px-4 py-2 rounded-md ${
            view === "myApplications"
              ? "bg-blue-600 text-white cursor-pointer"
              : "bg-tranparent border border-gray-200 cursor-pointer"
          }`}
        >
          My Applications
        </button>
        {canManageJobs && (
          <button
            onClick={() => setView("manageJobs")}
            className={`px-4 py-2 rounded-md ${
              view === "manageJobs"
                ? "bg-blue-600 text-white"
                : "bg-transparent border border-gray-200 cursor-pointer"
            }`}
          >
            Manage Jobs
          </button>
        )}
      </div>
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{success}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setSuccess(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Job Listings View */}
      {view === "jobs" && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs, companies, locations..."
                className="pl-10 pr-4 py-2 w-full border rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-md min-w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="internship">Internship</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          {/* Job Cards */}
          {loading ? (
            <div className="flex justify-center items-center h-60  bg-blue-300/50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => {
                const applicationStatus = getApplicationStatus(job.id);

                return (
                  <div
                    key={job.id}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow  odd:bg-blue-200/50 even:bg-purple-200/50"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <JobTypeBadge type={job.type} />
                      </div>

                      <div
                        className="flex items-center mb-3 cursor-pointer text-blue-600 hover:underline"
                        onClick={() =>
                          job.company_id && viewCompanyProfile(job.company_id)
                        }
                      >
                        <div className="w-6 h-6 mr-2 bg-gray-200 rounded-full overflow-hidden">
                          {job.company?.profile_pic ? (
                            <Image
                              src={job.company.profile_pic}
                              alt={job.company?.name || "Company"}
                              width={24}
                              height={24}
                            />
                          ) : (
                            <Briefcase size={16} className="m-1" />
                          )}
                        </div>
                        <span>{job.company?.name || "Unknown Company"}</span>
                      </div>

                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin size={16} className="mr-1" />
                        <span>{job.location}</span>
                      </div>

                      <div className="flex items-center text-gray-600 mb-4">
                        <Calendar size={16} className="mr-1" />
                        <span>Deadline: {formatDate(job.deadline)}</span>
                      </div>

                      <div className="pt-3 border-t flex justify-between items-center">
                        {applicationStatus ? (
                          <StatusBadge status={applicationStatus} />
                        ) : (
                          <button
                            onClick={() => handleApply(job)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            Apply Now
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedJob(job)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No jobs found matching your criteria
              </p>
            </div>
          )}
        </>
      )}

      {/* My Applications View */}
      {view === "myApplications" && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold mb-4">My Applications</h2>

          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Job Title</th>
                    <th className="px-4 py-2 text-left">Company</th>
                    <th className="px-4 py-2 text-left">Applied On</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const job = jobs.find((j) => j.id === app.job_id);

                    return (
                      <tr key={app.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {job?.title || "Unknown Job"}
                        </td>
                        <td className="px-4 py-3">
                          {job?.company?.name || "Unknown Company"}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(app.applied_at)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={app.resume_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mr-3"
                          >
                            View Resume
                          </a>
                          {job && (
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="text-blue-600 hover:underline"
                            >
                              View Job
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">
                You haven't applied to any jobs yet
              </p>
              <button
                onClick={() => setView("jobs")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manage Jobs View (Faculty/Admin only) */}
      {view === "manageJobs" && canManageJobs && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Manage Job Listings</h2>
            <button
              onClick={() => {
                resetJobForm();
                setShowJobForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Plus size={18} className="mr-2" /> Add New Job
            </button>
          </div>

          {jobs.filter((job) => job.company_id === user?.id).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Job Title</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Deadline</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs
                    .filter((job) => job.company_id === user?.id)
                    .map((job) => (
                      <tr key={job.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{job.title}</td>
                        <td className="px-4 py-3">
                          <JobTypeBadge type={job.type} />
                        </td>
                        <td className="px-4 py-3">{job.location}</td>
                        <td className="px-4 py-3">
                          {formatDate(job.deadline)}
                        </td>
                        <td className="px-4 py-3 flex items-center">
                          <button
                            onClick={() => fetchJobApplicants(job.id)}
                            className="text-blue-600 hover:underline mr-3"
                          >
                            View Applicants
                          </button>
                          <button
                            onClick={() => handleEditJob(job)}
                            className="text-gray-600 hover:text-blue-600 mr-3"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">You haven't posted any jobs yet</p>
              <button
                onClick={() => {
                  resetJobForm();
                  setShowJobForm(true);
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Post Your First Job
              </button>
            </div>
          )}
        </div>
      )}

      {/* Application Review View (Faculty/Admin only) */}
      {view === "applicationReview" && applicationToReview && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setView("manageJobs")}
              className="text-blue-600 hover:underline flex items-center mr-4"
            >
              &larr; Back to Jobs
            </button>
            <h2 className="text-xl font-semibold">
              Applications for{" "}
              {jobs.find((j) => j.id === applicationToReview)?.title || "Job"}
            </h2>
          </div>

          {jobApplicants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Applicant</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Applied On</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobApplicants.map((app) => (
                    <tr key={app.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
                          {app.applicant?.profile_pic ? (
                            <Image
                              src={app.applicant.profile_pic}
                              alt={app.applicant?.name || ""}
                              width={32}
                              height={32}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                              {app.applicant?.name?.charAt(0).toUpperCase() ||
                                "?"}
                            </div>
                          )}
                        </div>
                        <span>
                          {app.applicant?.name || "Unknown Applicant"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{app.applicant?.email}</td>
                      <td className="px-4 py-3">
                        {formatDate(app.applied_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <a
                            href={app.resume_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Resume
                          </a>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              updateApplicationStatus(
                                app.id,
                                e.target.value as Application["status"]
                              )
                            }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="applied">Applied</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No applications received yet</p>
            </div>
          )}
        </div>
      )}

      {/* Company Profile View */}
      {view === "company" && selectedCompany && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={() => setView("jobs")}
            className="text-blue-600 hover:underline flex items-center mb-6"
          >
            &larr; Back to Jobs
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                {selectedCompany.profile_pic ? (
                  <Image
                    src={selectedCompany.profile_pic}
                    alt={selectedCompany.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl">
                    {selectedCompany.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="md:w-3/4">
              <h2 className="text-2xl font-bold mb-2">
                {selectedCompany.name}
              </h2>
              <p className="text-gray-600 mb-4">{selectedCompany.email}</p>

              {selectedCompany.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-700">{selectedCompany.bio}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">Jobs Posted</h3>
                <div className="grid grid-cols-1 gap-4">
                  {jobs
                    .filter((job) => job.company_id === selectedCompany.id)
                    .map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between">
                          <h4 className="font-semibold">{job.title}</h4>
                          <JobTypeBadge type={job.type} />
                        </div>
                        <div className="flex items-center text-gray-600 mt-2">
                          <MapPin size={16} className="mr-1" />
                          <span>{job.location}</span>
                          <span className="mx-2">•</span>
                          <Calendar size={16} className="mr-1" />
                          <span>Deadline: {formatDate(job.deadline)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setView("jobs");
                          }}
                          className="text-blue-600 hover:underline text-sm mt-2"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <JobTypeBadge type={selectedJob.type} />
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-1" />
                  <span>{selectedJob.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-1" />
                  <span>Deadline: {formatDate(selectedJob.deadline)}</span>
                </div>
                {selectedJob.salary && (
                  <div className="flex items-center text-gray-600">
                    <span>Salary: {selectedJob.salary}</span>
                  </div>
                )}
              </div>

              <div
                className="flex items-center mb-6 cursor-pointer text-blue-600 hover:underline"
                onClick={() =>
                  selectedJob.company_id &&
                  viewCompanyProfile(selectedJob.company_id)
                }
              >
                <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full overflow-hidden">
                  {selectedJob.company?.profile_pic ? (
                    <Image
                      src={selectedJob.company.profile_pic}
                      alt={selectedJob.company?.name || "Company"}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <Briefcase size={20} className="m-1" />
                  )}
                </div>
                <span>{selectedJob.company?.name || "Unknown Company"}</span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {selectedJob.description}
                </div>
              </div>

              {selectedJob.eligibility && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Eligibility</h3>
                  <div className="text-gray-700 whitespace-pre-line">
                    {selectedJob.eligibility}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                {getApplicationStatus(selectedJob.id) ? (
                  <div className="flex items-center">
                    <div className="mr-2">Application Status:</div>
                    <StatusBadge
                      status={
                        getApplicationStatus(
                          selectedJob.id
                        ) as Application["status"]
                      }
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowApplyModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply for Job Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">
                  Apply for {selectedJob.title}
                </h2>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setResumeLink("");
                    setCoverLetter("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitApplication}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Resume (PDF)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <label
                      htmlFor="resume-link"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <span className="text-gray-500 mb-2">
                        Paste your resume link (Google Drive, OneDrive, etc.)
                      </span>
                      <input
                        type="url"
                        id="resume-link"
                        placeholder="https://example.com/resume.pdf"
                        value={resumeLink}
                        onChange={handleResumeLinkChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 h-32"
                    placeholder="Tell the employer why you're a good fit for this role..."
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setResumeLink("");
                      setCoverLetter("");
                    }}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !resumeLink}
                    className={`bg-blue-600 text-white px-6 py-2 rounded-md ${
                      isSubmitting || !resumeLink
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">
                  {isEditMode ? "Edit Job Listing" : "Create New Job Listing"}
                </h2>
                <button
                  onClick={() => setShowJobForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={isEditMode ? handleUpdateJob : handleCreateJob}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={jobFormData.title}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="e.g. Software Engineer Intern"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Job Type *
                    </label>
                    <select
                      name="type"
                      value={jobFormData.type}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2"
                      required
                    >
                      <option value="internship">Internship</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={jobFormData.deadline}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={jobFormData.location}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="e.g. Remote, New York, NY"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Salary (Optional)
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={jobFormData.salary}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="e.g. $50,000 - $70,000/year"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Job Description *
                    </label>
                    <textarea
                      name="description"
                      value={jobFormData.description}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2 h-32"
                      placeholder="Describe the role, responsibilities, and requirements"
                      required
                    ></textarea>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-1">
                      Eligibility (Optional)
                    </label>
                    <textarea
                      name="eligibility"
                      value={jobFormData.eligibility}
                      onChange={handleJobFormChange}
                      className="w-full border rounded-md px-3 py-2 h-24"
                      placeholder="Specify eligibility criteria, e.g., minimum GPA, year of study, skills"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJobForm(false)}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center bg-blue-600 text-white px-6 py-2 rounded-md ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : isEditMode ? (
                      <>
                        <Save size={18} className="mr-2" /> Update Job
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="mr-2" /> Create Job
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
