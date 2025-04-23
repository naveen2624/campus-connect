"use client";

import React from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

export default function CheckEmailPage() {
  return (
    <AuthLayout title="Check your email">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-xl font-medium text-gray-900">
          Verification email sent
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          We've sent you an email with a link to verify your account. Please
          check your inbox and spam folder.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
