// 16. Create Dashboard page (app/dashboard/page.tsx):
"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, ArrowRight } from "lucide-react";
// Mock data for events
const upcomingEvents = [
  {
    id: 1,
    title: "xxv Milan Tech",
    description: "National Level Cultural Fest",
    date: "03/04/2025",
    time: "12:00 PM - 07:00 PM",
    location: "SRM Institute of Science and Technology, Kattankulathur",
    organizer: "Directorate of Student Affairs",
    image: "/milan-poster.jpg",
    category: "Cultural",
  },
  {
    id: 2,
    title: "Recruitments Futurix",
    description:
      "Domains: Creatives,Operations, Sponsorship and Public Relations",
    date: "2025-04-16",
    time: "02:00 PM - 04:00 PM",
    location: "Online",
    organizer: "FUTURIX CTECH",
    image: "/futurix-recruitment.jpg",
    category: "Recruitments",
  },
  {
    id: 3,
    title: "HACKTRAX",
    description: "Fintech, Blockchain, AI/ML, Open Innovation",
    date: "2025-04-24",
    time: "11:00 AM - 11:00 AM(next day)",
    location: "To be Announced...",
    organizer: "Alexa Developers SRM",
    image: "/hacktrax.jpg",
    category: "Cultural",
  },
];

// Mock data for suggested teams
const suggestedTeams = [
  {
    id: 1,
    name: "UI/UX Innovators",
    event: "Tech Hackathon 2025",
    members: 3,
    maxMembers: 5,
    skills: ["UI Design", "Frontend Development", "User Research"],
    members_data: [
      { name: "Alex", image: "/alex.jpg" },
      { name: "Jamie", image: "/jamie.jpg" },
      { name: "Taylor", image: "/taylor.jpg" },
    ],
  },
  {
    id: 2,
    name: "Green Initiative",
    event: "Environmental Awareness Workshop",
    members: 4,
    maxMembers: 6,
    skills: ["Project Management", "Research", "Public Speaking"],
    members_data: [
      { name: "Morgan", image: "/morgan.jpg" },
      { name: "Casey", image: "/casey.jpg" },
      { name: "Jordan", image: "/jordan.jpg" },
      { name: "Avery", image: "/avery.jpg" },
    ],
  },
];
export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <main className="flex min-h-screen flex-col px-4 py-8 md:px-8 lg:px-12">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Campus Connect</h1>
          <p className="text-lg text-gray-600">
            Your one-stop platform for campus events and team building
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">Explore Events</Button>
          <Button size="lg" variant="outline">
            Find Teams
          </Button>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <Link
            href="/pages/events"
            className="flex items-center text-sm font-medium text-blue-600"
          >
            View All Events <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="h-full flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4">
                  {event.category}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Organized by {event.organizer}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  {event.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Link href="/register"> Register Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Suggested Teams Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Suggested Teams</h2>
          <Link
            href="/pages/teams"
            className="flex items-center text-sm font-medium text-blue-600"
          >
            Find More Teams <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestedTeams.map((team) => (
            <Card key={team.id} className="h-full">
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>For: {team.event}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {team.members}/{team.maxMembers} Members
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {team.members_data.map((member, index) => (
                      <Avatar key={index} className="border-2 border-white">
                        <AvatarImage
                          src={`/api/placeholder/40/40`}
                          alt={member.name}
                        />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {team.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Details</Button>
                <Button>Join Team</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
