"use client";

import React from "react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left side - Branding */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 md:w-1/2 flex flex-col justify-center items-center p-10 text-white relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white"></div>
        </div>

        <div className="max-w-md relative z-10">
          <h1 className="text-5xl font-bold mb-6">Welcome</h1>
          <div className="h-64 w-full relative rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl flex items-center justify-center p-6 overflow-hidden">
            <div className="w-24 h-24 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="md:w-1/2 flex justify-center items-center p-8 md:p-16">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
