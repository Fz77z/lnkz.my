"use client";

import { useState } from "react";
import { LinkIcon, ClipboardIcon } from "lucide-react";

export default function LinkShortener() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShortUrl("");

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();
      setShortUrl(data.shortUrl);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(shortUrl)
      .then(() => alert("Copied to clipboard!"))
      .catch(() => alert("Failed to copy. Please try manually."));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center rounded-md border-2 border-vercel-gray-700 bg-vercel-gray-800 focus-within:border-vercel-purple-600">
          <LinkIcon className="ml-2 text-gray-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your long URL here"
            required
            className="w-full bg-vercel-gray-800 p-2 text-white placeholder-gray-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-vercel-purple-600 py-2 text-white transition duration-300 hover:bg-vercel-purple-700 disabled:cursor-not-allowed disabled:bg-vercel-purple-800"
        >
          {isLoading ? "Shortening..." : "Shorten URL"}
        </button>
      </form>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}

      {shortUrl && (
        <div className="mt-6 rounded-md border border-vercel-gray-700 bg-vercel-gray-800 p-4">
          <p className="mb-2 text-gray-300">Your shortened URL:</p>
          <div className="flex items-center justify-between rounded-md border border-vercel-gray-700 bg-vercel-gray-900 p-2">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-vercel-blue-400 hover:underline"
            >
              {shortUrl}
            </a>
            <button
              onClick={copyToClipboard}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <ClipboardIcon size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
