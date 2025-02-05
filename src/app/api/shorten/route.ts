import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { linksTable } from "@/db/schema";
import { z } from "zod";

const shortenSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export async function POST(request: Request) {
  try {
    // Validate the incoming request using zod
    const { url } = shortenSchema.parse(await request.json());

    const createdAt = new Date().toISOString();
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const maxRetries = 5;
    let shortCode;
    for (let i = 0; i < maxRetries; i++) {
      shortCode = Math.random().toString(36).substr(2, 6);
      try {
        await db.insert(linksTable).values({
          slug: shortCode,
          url,
          createdAt,
          clicks: 0,
          ipAddress,
        });
        // If insertion succeeds, break out of the loop
        break;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("UNIQUE constraint failed")
        ) {
          if (i === maxRetries - 1) {
            throw new Error(
              "Failed to generate unique slug after multiple attempts",
            );
          }
          // Retry with a new slug
          continue;
        } else {
          throw err;
        }
      }
    }

    const shortUrl = `https://lnkz.my/${shortCode}`;

    return NextResponse.json({ shortUrl });
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 },
    );
  }
}
