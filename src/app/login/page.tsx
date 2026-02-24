"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    login: "", // Can be phone, email, or member number
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Determine if login is phone, email, or member number
      const loginData: any = {};
      const loginValue = formData.login.trim();
      
      if (loginValue.includes("@")) {
        loginData.email = loginValue;
      } else if (loginValue.startsWith("HAR-")) {
        loginData.memberNumber = loginValue;
      } else {
        loginData.phone = loginValue;
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store session (simple client-side for demo)
      localStorage.setItem("sacco_member", JSON.stringify(data.member));
      
      // Show success and redirect
      alert(`Welcome back, ${data.member.firstName}!`);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-amber-500">Harambee</h1>
          </Link>
          <p className="text-neutral-400 mt-2">Welcome back! Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Login (Phone/Email/Member Number) */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Phone, Email, or Member Number
            </label>
            <input
              type="text"
              name="login"
              required
              value={formData.login}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="+254 712 345 678 or john@example.com or HAR-123456"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600/50 disabled:cursor-not-allowed text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-neutral-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium">
            Register now
          </Link>
        </p>
      </div>
    </main>
  );
}
