"use client";

import { useState, useEffect } from "react";

// Download type definition
interface DownloadType {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Available download types
const downloadTypes: DownloadType[] = [
  { id: "members", name: "Members", description: "Download all member records", category: "Members" },
  { id: "savings", name: "Savings Accounts", description: "Download savings account balances", category: "Members" },
  { id: "loans", name: "Loans", description: "Download loan applications and status", category: "Loans" },
  { id: "transactions", name: "Transactions", description: "Download all financial transactions", category: "Finance" },
  { id: "penalties", name: "Penalties", description: "Download penalty records", category: "Loans" },
  { id: "credit_checks", name: "Credit Checks", description: "Download credit assessment records", category: "Loans" },
  { id: "guarantors", name: "Guarantors", description: "Download guarantor information", category: "Loans" },
  { id: "reminders", name: "Reminders", description: "Download sent reminders and notifications", category: "Communication" },
  { id: "audit_logs", name: "Audit Logs", description: "Download system audit trail", category: "Security" },
  { id: "compliance", name: "Compliance", description: "Download regulatory compliance records", category: "Compliance" },
  { id: "campaigns", name: "Campaigns", description: "Download capital campaign records", category: "Capital" },
  { id: "partners", name: "Partners", description: "Download partner/investor information", category: "Capital" },
  { id: "monthly_summary", name: "Monthly Summary", description: "Download monthly summary report", category: "Reports" },
  { id: "loan Portfolio", name: "Loan Portfolio", description: "Download active loan portfolio", category: "Reports" },
  { id: "member_statement", name: "Member Statement", description: "Download individual member statement", category: "Reports" },
];

// Format options
const formatOptions = [
  { id: "csv", name: "CSV", description: "Comma-separated values (Excel compatible)" },
  { id: "json", name: "JSON", description: "JavaScript Object Notation" },
  { id: "excel", name: "Excel", description: "Microsoft Excel format" },
];

// Category icons
const categoryIcons: Record<string, string> = {
  Members: "👥",
  Loans: "💳",
  Finance: "💰",
  Communication: "📧",
  Security: "🔒",
  Compliance: "📋",
  Capital: "🏦",
  Reports: "📊",
};

export default function DownloadsPage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [lastDownload, setLastDownload] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Group by category
  const categories = [...new Set(downloadTypes.map((d) => d.category))];

  // Handle download
  const handleDownload = async () => {
    if (!selectedType) {
      setError("Please select a download type");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("type", selectedType);
      params.set("format", selectedFormat);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (memberId) params.set("memberId", memberId);
      if (status) params.set("status", status);

      const response = await fetch(`/api/downloads?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      // Get filename from headers
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `${selectedType}.${selectedFormat}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadCount((prev) => prev + 1);
      setLastDownload(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Get current selection details
  const selectedTypeDetails = downloadTypes.find((d) => d.id === selectedType);

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">📥 Download Center</h1>
              <p className="text-neutral-400 mt-1">
                Export your SACCO data in various formats
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">{downloadCount}</div>
              <div className="text-sm text-neutral-400">Downloads this session</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Download Types */}
          <div className="lg:col-span-2 space-y-6">
            {categories.map((category) => (
              <div key={category} className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-neutral-750 border-b border-neutral-700 flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[category] || "📁"}</span>
                  <h2 className="text-lg font-semibold text-white">{category}</h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {downloadTypes
                    .filter((d) => d.category === category)
                    .map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                          selectedType === type.id
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-neutral-700/50 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500"
                        }`}
                      >
                        <div className="font-medium text-white">{type.name}</div>
                        <div className="text-sm text-neutral-400 mt-1">{type.description}</div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Options & Download */}
          <div className="space-y-6">
            {/* Selected Type */}
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Selected</h3>
              {selectedTypeDetails ? (
                <div className="bg-neutral-700/50 rounded-lg p-4 border border-neutral-600">
                  <div className="font-medium text-white">{selectedTypeDetails.name}</div>
                  <div className="text-sm text-neutral-400 mt-1">{selectedTypeDetails.description}</div>
                  <div className="mt-2 inline-block px-2 py-1 bg-neutral-600 rounded text-xs text-neutral-300">
                    {selectedTypeDetails.category}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-400 text-sm">Select a download type from the list</div>
              )}
            </div>

            {/* Format Selection */}
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Format</h3>
              <div className="space-y-3">
                {formatOptions.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      selectedFormat === format.id
                        ? "bg-blue-500/20 border-blue-500 text-white"
                        : "bg-neutral-700/50 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500"
                    }`}
                  >
                    <div className="font-medium">{format.name}</div>
                    <div className="text-sm text-neutral-400">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filters (Optional)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Member ID</label>
                  <input
                    type="number"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="Filter by member"
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!selectedType || isLoading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                !selectedType || isLoading
                  ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Preparing Download...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  📥 Download {selectedTypeDetails?.name || "Data"}
                </span>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
                {error}
              </div>
            )}

            {/* Last Download */}
            {lastDownload && (
              <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-4 text-emerald-300">
                ✓ Downloaded: {lastDownload}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
