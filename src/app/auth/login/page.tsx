"use client";

import React from "react";
import AuthLayout from "@/components/AuthLayout";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();

  return (
    <AuthLayout title="Sign in to your account">
      <AuthForm type="login" onSubmit={signIn} />
    </AuthLayout>
  );
}
