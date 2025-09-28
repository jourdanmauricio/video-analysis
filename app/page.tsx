"use client";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

import VideoProcessor from "@/components/VideoProcessor";

export default function Home() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <p className="text-sm text-gray-700">
          Signed in as {session?.user?.email}
        </p>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign out
        </button>
      </header>
      <VideoProcessor />
    </div>
  );
}
