import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { linksTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: unknown,
): Promise<NextResponse> {
  const { params } = context as { params: { slug: string | string[] } };
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  // Query the database for the matching link
  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.slug, slug));

  if (!link) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Optionally update click count
  await db
    .update(linksTable)
    .set({ clicks: link.clicks + 1 })
    .where(eq(linksTable.slug, slug));

  return NextResponse.redirect(link.url);
}
