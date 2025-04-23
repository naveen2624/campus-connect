// 8. Create Signup Page (pages/auth/signup.tsx):
"use client";

import React from "react";
import AuthLayout from "@/components/AuthLayout";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { signUp } = useAuth();

  return (
    <AuthLayout title="Create an account">
      <AuthForm type="signup" onSubmit={signUp} />
    </AuthLayout>
  );
}
