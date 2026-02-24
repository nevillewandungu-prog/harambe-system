"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    dateOfBirth: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Store member in localStorage
      localStorage.setItem("sacco_member", JSON.stringify(data.member));
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-neutral-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Harambee Sacco!</h1>
          <p className="text-neutral-400 mb-6">
            Your registration was successful. You can now enjoy our financial services.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-amber-500">Harambee</h1>
          </Link>
          <p className="text-neutral-400 mt-2">Join our SACCO today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Phone Number *
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

          {/* ID Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              National ID Number
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="12345678"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full bg-neutral-700 border border-neutral-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Nairobi, Kenya"
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
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-neutral-400 mt-6">
          Already a member?{" "}
          <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
