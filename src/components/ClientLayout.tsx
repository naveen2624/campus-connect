"use client";

import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="mt-12 ">{children}</main>
    </BrowserRouter>
  );
}
