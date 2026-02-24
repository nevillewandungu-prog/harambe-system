"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState<"email" | "phone" | "memberNumber">("email");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    memberNumber: "",
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
      const payload: Record<string, string> = { password: formData.password };
      
      if (loginType === "email") {
        payload.email = formData.email;
      } else if (loginType === "phone") {
        payload.phone = formData.phone;
      } else {
        payload.memberNumber = formData.memberNumber;
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store member in localStorage
      localStorage.setItem("sacco_member", JSON.stringify(data.member));
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-amber-500">Harambee</h1>
          </Link>
          <p className="text-neutral-400 mt-2">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Login Type Tabs */}
        <div className="flex rounded-lg bg-neutral-700 p-1 mb-6">
          <button
            type="button"
            onClick={() => setLoginType("email")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "email"
                ? "bg-neutral-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginType("phone")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "phone"
                ? "bg-neutral-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => setLoginType("memberNumber")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "memberNumber"
                ? "bg-neutral-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Member No.
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          {loginType === "email" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="john@example.com"
              />
            </div>
          )}

          {/* Phone Field */}
          {loginType === "phone" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="+254 712 345 678"
              />
            </div>
          )}

          {/* Member Number Field */}
          {loginType === "memberNumber" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Member Number
              </label>
              <input
                type="text"
                name="memberNumber"
                required
                value={formData.memberNumber}
                onChange={handleChange}
                className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="HAR001"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="••••••••"
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
                Signing In...
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
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}
