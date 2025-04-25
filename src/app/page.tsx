"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/SupabaseClient";

// Sample data fetching functions
async function fetchFeaturedEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_datetime", { ascending: true })
    .limit(5);

  if (error) console.error("Error fetching events:", error);
  return data || [];
}

async function fetchUpcomingDeadlines() {
  const today = new Date().toISOString();

  // Fetch events with approaching deadlines
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .gt("start_datetime", today)
    .order("start_datetime", { ascending: true })
    .limit(3);

  // Fetch jobs with approaching deadlines
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*, company_id(name)")
    .gt("deadline", today)
    .order("deadline", { ascending: true })
    .limit(3);

  if (eventsError) console.error("Error fetching events:", eventsError);
  if (jobsError) console.error("Error fetching jobs:", jobsError);

  return { events: events || [], jobs: jobs || [] };
}

async function fetchTopClubs() {
  const { data, error } = await supabase.from("clubs").select("*").limit(4);

  if (error) console.error("Error fetching clubs:", error);
  return data || [];
}

async function fetchOpenTeams() {
  const { data, error } = await supabase
    .from("teams")
    .select("*, events(title)")
    .eq("is_open", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) console.error("Error fetching teams:", error);
  return data || [];
}

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [deadlines, setDeadlines] = useState({ events: [], jobs: [] });
  const [topClubs, setTopClubs] = useState([]);
  const [openTeams, setOpenTeams] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const element = document.getElementById("myDiv");
    console.log(element);
  }, []);
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const events = await fetchFeaturedEvents();
      const deadlinesData = await fetchUpcomingDeadlines();
      const clubs = await fetchTopClubs();
      const teams = await fetchOpenTeams();

      setFeaturedEvents(events);
      setDeadlines(deadlinesData);
      setTopClubs(clubs);
      setOpenTeams(teams);
      setIsLoading(false);
    }

    loadData();

    // Auto-advance carousel
    const carouselInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % (featuredEvents.length || 1));
    }, 5000);

    return () => clearInterval(carouselInterval);
  }, []);

  // Sample event types for filtering
  const categories = [
    { id: "all", label: "All" },
    { id: "hackathons", label: "Hackathons" },
    { id: "workshops", label: "Workshops" },
    { id: "jobs", label: "Jobs" },
    { id: "clubs", label: "Clubs" },
    { id: "talks", label: "Talks" },
  ];

  // Sample event data for carousel if API fails
  const sampleEvents = [
    {
      id: "1",
      title: "CodeCraft 2025 Hackathon",
      description:
        "Join the biggest coding hackathon of the year with amazing prizes and networking opportunities.",
      type: "hackathon",
      poster_url: "/images/hackathon-poster.jpg",
      start_datetime: "2025-05-15T09:00:00Z",
      end_datetime: "2025-05-17T18:00:00Z",
      mode: "hybrid",
      is_team_based: true,
    },
    {
      id: "2",
      title: "ML Workshop Series",
      description:
        "Learn machine learning fundamentals and implementation with industry experts.",
      type: "workshop",
      poster_url: "/images/ml-workshop.jpg",
      start_datetime: "2025-05-10T14:00:00Z",
      end_datetime: "2025-05-10T17:00:00Z",
      mode: "online",
      is_team_based: false,
    },
    {
      id: "3",
      title: "Google Pre-Placement Talk",
      description:
        "Get insights into Google's recruitment process and learn about upcoming opportunities.",
      type: "talk",
      poster_url: "/images/google-talk.jpg",
      start_datetime: "2025-05-05T16:00:00Z",
      end_datetime: "2025-05-05T18:00:00Z",
      mode: "hybrid",
      is_team_based: false,
    },
  ];

  // Use sample data if API data is not available yet
  const displayEvents =
    featuredEvents.length > 0 ? featuredEvents : sampleEvents;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section with Carousel */}
      <section className="relative w-full h-96 overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-800">
        <div className="absolute inset-0 bg-black opacity-40"></div>

        {/* Carousel */}
        <div className="relative h-full">
          {displayEvents.map((event, index) => (
            <div
              key={event.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              {event.poster_url && (
                <div className="absolute inset-0">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.poster_url})` }}
                  ></div>
                </div>
              )}

              <div className="relative flex items-center h-full px-8 md:px-16 z-10">
                <div className="max-w-3xl text-white">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3">
                    {event.title}
                  </h1>
                  <p className="text-lg mb-6">{event.description}</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
                      {event.type}
                    </span>
                    <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm font-medium">
                      {event.mode}
                    </span>
                    {event.is_team_based && (
                      <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium">
                        Team-based
                      </span>
                    )}
                  </div>
                  <Link href={`/events/${event.id}`}>
                    <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Arrow Controls */}
          <button
            onClick={() => {
              setActiveSlide((prev) =>
                prev === 0 ? displayEvents.length - 1 : prev - 1
              );
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-20 transition"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => {
              setActiveSlide((prev) =>
                prev === displayEvents.length - 1 ? 0 : prev + 1
              );
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-20 transition"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {displayEvents.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === activeSlide ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="py-6 bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar space-x-4 py-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-5 py-2 rounded-full whitespace-nowrap ${
                  activeCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } transition`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="Search events, jobs, clubs..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Search
          </button>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Featured Cards */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Featured Opportunities</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-md p-4 h-64 animate-pulse"
                  >
                    <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md mb-2 w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayEvents.slice(0, 4).map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col">
                      <div className="relative h-40 bg-gray-100">
                        {event.poster_url ? (
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${event.poster_url})`,
                            }}
                          ></div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
                            <span className="text-xl font-semibold text-blue-800">
                              {event.title}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                          {event.type}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                          {event.description ||
                            "Join this exciting event and enhance your skills."}
                        </p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              ></path>
                            </svg>
                            {new Date(
                              event.start_datetime
                            ).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              ></path>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                            </svg>
                            {event.mode}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/events">
                <button className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                  View All Events
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Upcoming Deadlines
              </h3>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.events.map((event) => (
                    <Link href={`/events/${event.id}`} key={event.id}>
                      <div className="group flex justify-between items-start hover:bg-blue-50 p-2 rounded-md -m-2 transition">
                        <div>
                          <p className="font-medium group-hover:text-blue-600">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              event.start_datetime
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Event
                        </span>
                      </div>
                    </Link>
                  ))}

                  {deadlines.jobs.map((job) => (
                    <Link href={`/jobs/${job.id}`} key={job.id}>
                      <div className="group flex justify-between items-start hover:bg-blue-50 p-2 rounded-md -m-2 transition">
                        <div>
                          <p className="font-medium group-hover:text-blue-600">
                            {job.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            Deadline:{" "}
                            {new Date(job.deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Job
                        </span>
                      </div>
                    </Link>
                  ))}

                  {deadlines.events.length === 0 &&
                    deadlines.jobs.length === 0 && (
                      <p className="text-gray-500 text-center py-2">
                        No upcoming deadlines
                      </p>
                    )}
                </div>
              )}
            </div>

            {/* Join a Team */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                Join a Team
              </h3>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {openTeams.map((team) => (
                    <Link href={`/teams/${team.id}`} key={team.id}>
                      <div className="group flex justify-between items-start hover:bg-blue-50 p-2 rounded-md -m-2 transition">
                        <div>
                          <p className="font-medium group-hover:text-blue-600">
                            {team.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {team.events?.title || "Hackathon Event"}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Open
                        </span>
                      </div>
                    </Link>
                  ))}

                  {openTeams.length === 0 && (
                    <p className="text-gray-500 text-center py-2">
                      No open teams available
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link href="/teams">
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View All Teams
                  </button>
                </Link>
              </div>
            </div>

            {/* Live Now */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-red-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                  ></path>
                </svg>
                Live Now
              </h3>

              <div className="relative overflow-hidden rounded-md bg-purple-800 mb-3">
                <div className="p-4">
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full inline-flex items-center mb-2">
                    <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                    LIVE
                  </span>
                  <h4 className="font-medium">Python Flask Workshop</h4>
                  <p className="text-sm text-purple-200">
                    Join now to learn web development with Flask
                  </p>
                </div>
                <div className="p-3 bg-purple-900 flex justify-between">
                  <span className="text-xs text-purple-200">
                    32 students attending
                  </span>
                  <Link href="/events/live/1">
                    <button className="text-xs font-medium text-white hover:underline">
                      Join →
                    </button>
                  </Link>
                </div>
              </div>

              <Link href="/events/live">
                <button className="w-full py-2 bg-white text-purple-600 rounded font-medium hover:bg-purple-50 transition">
                  View All Live Events
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Clubs */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">
            Popular Clubs & Communities
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md p-6 h-48 animate-pulse"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded-md mb-2 w-1/2 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-1/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topClubs.length > 0
                ? topClubs.map((club) => (
                    <Link href={`/clubs/${club.id}`} key={club.id}>
                      <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
                        <div className="mb-4 flex justify-center">
                          {club.logo_url ? (
                            <div
                              className="w-16 h-16 rounded-full bg-cover bg-center border-2 border-indigo-100"
                              style={{
                                backgroundImage: `url(${club.logo_url})`,
                              }}
                            ></div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                              {club.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                          {club.name}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {club.description ||
                            "Join our community to learn, share, and grow together."}
                        </p>
                        <button className="px-4 py-1 border border-blue-500 text-blue-500 rounded-full text-sm hover:bg-blue-50 transition">
                          Join Club
                        </button>
                      </div>
                    </Link>
                  ))
                : // Fallback clubs if API fails
                  [
                    {
                      id: "c1",
                      name: "CodeHub",
                      description:
                        "Community for coding enthusiasts and developers",
                    },
                    {
                      id: "c2",
                      name: "AI Club",
                      description:
                        "Exploring machine learning and artificial intelligence",
                    },
                    {
                      id: "c3",
                      name: "Design Society",
                      description: "For students passionate about UX/UI design",
                    },
                    {
                      id: "c4",
                      name: "Robotics Club",
                      description:
                        "Building and programming robots for competitions",
                    },
                  ].map((club) => (
                    <Link href={`/clubs/${club.id}`} key={club.id}>
                      <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
                        <div className="mb-4 flex justify-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                            {club.name.charAt(0)}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                          {club.name}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {club.description}
                        </p>
                        <button className="px-4 py-1 border border-blue-500 text-blue-500 rounded-full text-sm hover:bg-blue-50 transition">
                          Join Club
                        </button>
                      </div>
                    </Link>
                  ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/clubs">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Explore All Clubs
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to boost your career?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join our platform to discover opportunities, connect with peers, and
            build your future.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/register">
              <button className="px-8 py-3 bg-white text-blue-800 rounded-lg font-medium hover:bg-gray-100 transition">
                Sign Up Now
              </button>
            </Link>
            <Link href="/events">
              <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition">
                Browse Events
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Add custom styles for the hide-scrollbar class */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
