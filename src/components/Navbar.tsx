"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu, X, User, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  username?: string;
}

const Navbar: React.FC<NavbarProps> = ({ username = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, session, loading: authLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<{
    name: string;
    user_type: string;
  } | null>(null);

  // Track scrolling for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set user details from session
  useEffect(() => {
    if (session?.user) {
      const userData = session.user.user_metadata;
      setUserDetails({
        name: userData?.name || username || "",
        user_type: userData?.user_type || "student",
      });
    }
  }, [session, username]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: "Jobs", path: "/jobs" },
    { name: "Clubs", path: "/clubs" },
    { name: "Teams", path: "/teams" },
  ];

  // User type specific links
  const userTypeLinks = {
    faculty: [{ name: "Create Event", path: "/create-event" }],
    admin: [{ name: "Admin Panel", path: "/admin" }],
  };

  const getExtraLinks = () => {
    if (!userDetails || userDetails.user_type === "student") return [];
    return (
      userTypeLinks[userDetails.user_type as keyof typeof userTypeLinks] || []
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-16 flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">
                Campus Connect
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.path
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {session &&
                user &&
                getExtraLinks().map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50"
                  >
                    {link.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* Search, Notification, and Profile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-8 pr-2 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {session && user ? (
              <>
                <button className="relative text-gray-500 hover:text-gray-700">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {userDetails?.name ? (
                        userDetails.name.charAt(0).toUpperCase()
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => signOut()}
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <LogOut size={16} className="mr-2" />
                            <span>Sign out</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {session && user && (
              <button className="mr-4 text-gray-500 hover:text-gray-700">
                <Bell size={20} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.path
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {session &&
              user &&
              getExtraLinks().map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                >
                  {link.name}
                </Link>
              ))}

            {session && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="mr-2" />
                    <span>Sign out</span>
                  </div>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 pt-2 pb-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-center text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
