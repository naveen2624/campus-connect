"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/SupabaseClient";

type UserType = "student" | "faculty" | "admin";

interface UserDetails {
  name: string;
  user_type: UserType;
  dept?: string;
  year?: number;
  bio?: string;
  skills?: string[];
  resume_link?: string;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userDetails: UserDetails
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
      }

      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userDetails: UserDetails
  ) => {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userDetails.name,
            user_type: userDetails.user_type,
          },
        },
      });

      if (authError) throw authError;

      // Only proceed with user table insertion if we have a user
      if (authData.user) {
        // Then insert the user data into the users table
        const { error: insertError } = await supabase.from("users").insert({
          id: authData.user.id,
          name: userDetails.name,
          email: email, // Use the email provided in the signup form
          password_hash: "managed_by_supabase_auth", // We don't store the actual hash
          user_type: userDetails.user_type,
          dept: userDetails.dept || null,
          year: userDetails.year || null,
          bio: userDetails.bio || null,
          skills: userDetails.skills || [],
          resume_link: userDetails.resume_link || null,
        });

        if (insertError) {
          console.error("Error inserting user data:", insertError);
          // If user data insertion fails, attempt to clean up the auth user
          try {
            // Note: This might not be possible without admin privileges
            // You might need server-side functions for this cleanup
            console.error(
              "Failed to create user record. Auth record was created but user table insertion failed."
            );
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }
          throw insertError;
        }
      }

      // Wait a moment before redirecting to avoid the rate limiting error
      setTimeout(() => {
        router.push("/auth/check-email");
      }, 1000);
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
