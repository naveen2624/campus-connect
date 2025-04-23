import React from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
const Navbar = () => {
  return (
    <div>
      <header className="border-b py-4 px-4 md:px-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">
            <Link href="/">Campus Connect</Link>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/pages/events" className="hover:text-blue-600">
              Events
            </a>
            <a href="/pages/teams" className="hover:text-blue-600">
              Teams
            </a>
            <a href="/pages/clubs" className="hover:text-blue-600">
              Clubs
            </a>
            <a href="/pages/internships" className="hover:text-blue-600">
              Internships
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <a
              href="/auth/login"
              className="text-sm font-medium hover:text-blue-600"
            >
              Login
            </a>
            <a
              href="/auth/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Sign Up
            </a>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
