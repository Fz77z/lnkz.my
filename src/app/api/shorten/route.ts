import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { linksTable } from "@/db/schema";
import { z } from "zod";

// URL validation schema with additional security checks
const shortenSchema = z.object({
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname !== "lnkz.my";
        } catch {
          return false;
        }
      },
      { message: "Cannot shorten an already shortened URL" },
    )
    .transform((url) => url.trim()),
  shortCode: z.string().length(6).optional(),
});

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute

interface RateLimit {
  timestamp: number;
  count: number;
}

const rateLimits = new Map<string, RateLimit>();

// Clean up old rate limit entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, limit] of rateLimits.entries()) {
      if (now - limit.timestamp > RATE_LIMIT_WINDOW) {
        rateLimits.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit) {
    rateLimits.set(ip, { timestamp: now, count: 1 });
    return false;
  }

  if (now - limit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimits.set(ip, { timestamp: now, count: 1 });
    return false;
  }

  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  limit.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    // Get and validate IP address
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Check rate limit
    if (isRateLimited(ipAddress)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    // Parse and validate the URL and optional short code
    const { url, shortCode: providedCode } = shortenSchema.parse(
      await request.json(),
    );

    // Use provided code or generate a new one
    const shortCode =
      providedCode || Math.random().toString(36).substring(2, 8);
    const shortUrl = `https://lnkz.my/${shortCode}`;

    // Insert into the database
    await db.insert(linksTable).values({
      slug: shortCode,
      url,
      createdAt: new Date().toISOString(),
      clicks: 0,
      ipAddress,
    });

    return NextResponse.json({ shortUrl });
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 },
    );
  }
}
