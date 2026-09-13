"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { ShieldCheck, Map, Activity, LogOut, Loader2, User as UserIcon } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:bg-blue-700 transition-colors shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              Pothole Reporting System<span className="text-blue-600">.</span>
            </span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <Link 
              href="/report" 
              className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              Map & Report
            </Link>

            {status === "loading" ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : session ? (
              <div className="flex items-center gap-4 ml-2 border-l border-gray-200 pl-4">
                <Link 
                  href="/dashboard"
                  className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-4 h-4" /> Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn()}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 shadow-sm transition-all text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
