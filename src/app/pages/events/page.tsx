import React from "react";
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
import { Calendar, Clock, MapPin, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

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
  {
    id: 4,
    title: "Tech Hackathon 2025",
    description: "A 24-hour coding competition to solve real-world problems.",
    date: "2025-04-15",
    time: "09:00 AM - 09:00 AM (next day)",
    location: "Engineering Building, Room 302",
    organizer: "Tech Club",
    image: "/tech-hackathon.jpg",
    category: "Technology",
  },
  {
    id: 5,
    title: "Environmental Awareness Workshop",
    description:
      "Learn about sustainable practices and how to implement them on campus.",
    date: "2025-04-10",
    time: "02:00 PM - 04:00 PM",
    location: "Student Center, Hall A",
    organizer: "Eco Club",
    image: "/eco-workshop.jpg",
    category: "Environment",
  },
  {
    id: 6,
    title: "Spring Cultural Festival",
    description:
      "Celebrate diverse cultures through performances, food, and art exhibitions.",
    date: "2025-04-20",
    time: "11:00 AM - 08:00 PM",
    location: "Campus Grounds",
    organizer: "Cultural Association",
    image: "/cultural-fest.jpg",
    category: "Cultural",
  },
];
const page = () => {
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="flex text-2xl font-bold justify-center">
          Upcoming Events
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8 px-8">
        {upcomingEvents.map((event) => (
          <Card
            key={event.id}
            className="h-full flex flex-col  bg-primary-foreground ring-1 ring-ring"
          >
            <div className="h-48 overflow-hidden relative">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 right-4">{event.category}</Badge>
            </div>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Organized by {event.organizer}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600 mb-4">{event.description}</p>
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
    </div>
  );
};

export default page;
