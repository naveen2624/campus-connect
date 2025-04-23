"use client";

import React from "react";
import { AuthProvider as AuthContextProvider } from "@/context/AuthContext";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
