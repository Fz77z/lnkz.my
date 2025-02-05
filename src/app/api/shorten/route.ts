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

    const shortCode = Math.random().toString(36).substr(2, 6);
    const shortUrl = `https://lnkz.my/${shortCode}`;

    // Insert into the database in the background without blocking the response
    void (async () => {
      try {
        await db.insert(linksTable).values({
          slug: shortCode,
          url,
          createdAt,
          clicks: 0,
          ipAddress,
        });
      } catch (err) {
        console.error("Background DB insertion error:", err);
      }
    })();

    return NextResponse.json({ shortUrl });
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 },
    );
  }
}
