"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("sacco_member");
    if (!stored) {
      router.push("/register");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("sacco_member");
    router.push("/register");
  };

  // Use a key to force re-render when component mounts
  const memberKey = typeof window !== "undefined" ? localStorage.getItem("sacco_member") : null;
  const member = memberKey ? JSON.parse(memberKey) : null;

  if (!member) {
    return (
      <main className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-amber-500 text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-amber-500">Harambee</h1>
              <span className="text-neutral-400">Sacco Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-neutral-300">
                Welcome, {member?.firstName} {member?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="text-neutral-400 text-sm mb-1">Member Number</div>
            <div className="text-2xl font-bold text-white">{member?.memberNumber || "N/A"}</div>
          </div>
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="text-neutral-400 text-sm mb-1">Account Status</div>
            <div className="text-2xl font-bold text-green-500">Active</div>
          </div>
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="text-neutral-400 text-sm mb-1">Total Savings</div>
            <div className="text-2xl font-bold text-amber-500">KES 0.00</div>
          </div>
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="text-neutral-400 text-sm mb-1">Active Loans</div>
            <div className="text-2xl font-bold text-blue-500">0</div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/savings"
            className="bg-neutral-800 hover:bg-neutral-750 rounded-xl p-6 border border-neutral-700 hover:border-amber-500 transition-colors group"
          >
            <div className="text-3xl mb-3">💰</div>
            <div className="text-lg font-semibold text-white group-hover:text-amber-500 transition-colors">
              Savings Account
            </div>
            <div className="text-neutral-400 text-sm mt-1">
              View and manage your savings
            </div>
          </Link>

          <Link
            href="/loans"
            className="bg-neutral-800 hover:bg-neutral-750 rounded-xl p-6 border border-neutral-700 hover:border-amber-500 transition-colors group"
          >
            <div className="text-3xl mb-3">📋</div>
            <div className="text-lg font-semibold text-white group-hover:text-amber-500 transition-colors">
              Apply for Loan
            </div>
            <div className="text-neutral-400 text-sm mt-1">
              Request a new loan
            </div>
          </Link>

          <Link
            href="/transactions"
            className="bg-neutral-800 hover:bg-neutral-750 rounded-xl p-6 border border-neutral-700 hover:border-amber-500 transition-colors group"
          >
            <div className="text-3xl mb-3">📊</div>
            <div className="text-lg font-semibold text-white group-hover:text-amber-500 transition-colors">
              Transactions
            </div>
            <div className="text-neutral-400 text-sm mt-1">
              View your transaction history
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Recent Activity</h2>
        <div className="bg-neutral-800 rounded-xl border border-neutral-700">
          <div className="p-6 text-center text-neutral-400">
            No recent activity. Your transactions will appear here.
          </div>
        </div>
      </div>
    </main>
  );
}
