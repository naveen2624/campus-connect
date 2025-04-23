import { Calendar, Clock, MapPin, Users, ArrowRight } from "lucide-react";
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
import React from "react";
const suggestedTeams = [
  {
    id: 1,
    name: "Tech Titans",
    event: "Bangalore Innovation Summit",
    members: 3,
    maxMembers: 10,
    skills: ["App Development", "AI Research"],
    members_data: [
      { name: "Ravi", image: "/ravi.jpg" },
      { name: "Priya", image: "/priya.jpg" },
      { name: "Arjun", image: "/arjun.jpg" },
    ],
  },
  {
    id: 2,
    name: "Sustainability Warriors",
    event: "Green Earth Conference",
    members: 4,
    maxMembers: 6,
    skills: ["Sustainability", "Project Management", "Public Speaking"],
    members_data: [
      { name: "Ishita", image: "/ishita.jpg" },
      { name: "Rohan", image: "/rohan.jpg" },
      { name: "Ananya", image: "/ananya.jpg" },
      { name: "Sidharth", image: "/sidharth.jpg" },
    ],
  },
  {
    id: 3,
    name: "UX Pioneers",
    event: "Mumbai TechFest",
    members: 3,
    maxMembers: 5,
    skills: ["UI Design", "Frontend Development", "User Research"],
    members_data: [
      { name: "Neha", image: "/neha.jpg" },
      { name: "Karan", image: "/karan.jpg" },
      { name: "Simran", image: "/simran.jpg" },
    ],
  },
  {
    id: 4,
    name: "Sustainability Warriors",
    event: "Green Earth Conference",
    members: 4,
    maxMembers: 6,
    skills: ["Sustainability", "Project Management", "Public Speaking"],
    members_data: [
      { name: "Ishita", image: "/ishita.jpg" },
      { name: "Rohan", image: "/rohan.jpg" },
      { name: "Ananya", image: "/ananya.jpg" },
      { name: "Sidharth", image: "/sidharth.jpg" },
    ],
  },
  {
    id: 5,
    name: "UX Pioneers",
    event: "Mumbai TechFest",
    members: 3,
    maxMembers: 5,
    skills: ["UI Design", "Frontend Development", "User Research"],
    members_data: [
      { name: "Neha", image: "/neha.jpg" },
      { name: "Karan", image: "/karan.jpg" },
      { name: "Simran", image: "/simran.jpg" },
    ],
  },
  {
    id: 6,
    name: "Sustainability Warriors",
    event: "Green Earth Conference",
    members: 4,
    maxMembers: 6,
    skills: ["Sustainability", "Project Management", "Public Speaking"],
    members_data: [
      { name: "Ishita", image: "/ishita.jpg" },
      { name: "Rohan", image: "/rohan.jpg" },
      { name: "Ananya", image: "/ananya.jpg" },
      { name: "Sidharth", image: "/sidharth.jpg" },
    ],
  },
];

const page = () => {
  return (
    <div>
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
    </div>
  );
};

export default page;
