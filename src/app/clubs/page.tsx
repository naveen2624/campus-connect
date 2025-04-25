"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/SupabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Search, Plus } from "lucide-react";

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchClubs();
    checkCurrentUser();
  }, []);

  async function checkCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(data);
    }
  }

  async function fetchClubs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clubs")
        .select(
          `
          *,
          users:created_by(name, profile_pic),
          club_members_count:clubmembers(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 bg-gradient-to-br from-blue-800 to-purple-500 text-white p-6 rounded-lg shadow-md h-40 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Clubs & Communities</h1>
      </header>
      <div className="flex justify-between items-center mb-8">
        {currentUser?.user_type === "admin" && (
          <button
            onClick={() => router.push("/clubs/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="mr-2" size={18} /> Create Club
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club) => (
              <Link href={`/clubs/${club.id}`} key={club.id}>
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow  bg-blue-300/50">
                  <div className="h-48 bg-gray-100 relative">
                    {club.logo_url ? (
                      <Image
                        src={club.logo_url}
                        alt={club.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-blue-50">
                        <span className="text-2xl font-bold text-blue-300">
                          {club.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{club.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {club.description || "No description available"}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {club.users?.profile_pic ? (
                          <Image
                            src={club.users.profile_pic}
                            alt={club.users.name}
                            width={24}
                            height={24}
                            className="rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                        )}
                        <span className="text-sm text-gray-500">
                          {club.users?.name || "Unknown"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {club.club_members_count.count} members
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-xl text-gray-500">
                No clubs found matching your search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
