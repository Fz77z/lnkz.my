import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { linksTable } from "@/db/schema";
import { z } from "zod";

// Blocked URL patterns (case insensitive)
const BLOCKED_PATTERNS = [
  /^javascript:/i, // JavaScript protocol
  /^data:/i, // Data protocol
  /^vbscript:/i, // VBScript protocol
  /^file:/i, // File protocol
];

// URL validation schema with additional security checks
const shortenSchema = z.object({
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          // Only block if the input URL is from our domain
          return urlObj.hostname !== "lnkz.my";
        } catch {
          return false;
        }
      },
      { message: "Cannot shorten an already shortened URL" },
    )
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Only HTTP and HTTPS protocols are allowed",
    })
    .refine((url) => url.length <= 2048, { message: "URL is too long" })
    .refine((url) => !BLOCKED_PATTERNS.some((pattern) => pattern.test(url)), {
      message: "URL contains suspicious patterns",
    })
    .transform((url) => url.trim()),
});

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute
const MAX_URLS_PER_IP = 100; // Maximum number of URLs per IP

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
    // Validate request method
    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    // Check request size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    // Get and validate IP address with additional checks
    let ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] || // Get first IP if multiple
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Basic IP validation
    if (!ipAddress.match(/^[\d\.a-f\:]+$/i)) {
      ipAddress = "0.0.0.0"; // Invalid IP, use placeholder
    }

    // Check rate limit
    if (isRateLimited(ipAddress)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: RATE_LIMIT_WINDOW / 1000,
        },
        {
          status: 429,
          headers: {
            "Retry-After": (RATE_LIMIT_WINDOW / 1000).toString(),
          },
        },
      );
    }

    // Check total URLs created by this IP using SQL count
    const result = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(linksTable)
      .where(sql`ipAddress = ${ipAddress}`);

    const urlCount = Number(result[0]?.count ?? 0);

    if (urlCount >= MAX_URLS_PER_IP) {
      return NextResponse.json(
        { error: "Maximum number of URLs created for this IP address" },
        { status: 403 },
      );
    }

    // Parse and validate the URL
    const { url } = shortenSchema.parse(await request.json());

    const createdAt = new Date().toISOString();

    // Generate a secure random short code
    const shortCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => (b % 36).toString(36)) // Ensure we only get chars 0-9 and a-z
      .join("")
      .slice(0, 6);

    const shortUrl = `https://lnkz.my/${shortCode}`;

    // Insert into the database
    try {
      await db.insert(linksTable).values({
        slug: shortCode,
        url,
        createdAt,
        clicks: 0,
        ipAddress,
      });
    } catch (err) {
      console.error("Database insertion error:", err);
      return NextResponse.json(
        { error: "Failed to create short URL" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { shortUrl },
      {
        headers: {
          "Content-Security-Policy": "default-src 'self'",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "no-referrer",
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
          "X-XSS-Protection": "1; mode=block",
          "X-Permitted-Cross-Domain-Policies": "none",
          "Cross-Origin-Resource-Policy": "same-origin",
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Embedder-Policy": "require-corp",
        },
      },
    );
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 },
    );
  }
}
