import { NextResponse } from "next/server";
import { getCachedParts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const category = searchParams.get("category") || "All";

    const allParts = await getCachedParts();

    if (!q && category === "All") {
      return NextResponse.json({ parts: allParts.slice(0, 8) });
    }

    const filtered = allParts.filter((part) => {
      const matchCategory =
        category === "All" || part.category.toLowerCase() === category.toLowerCase();
      if (!matchCategory) return false;

      if (!q) return true;

      const nameMatch = part.name.toLowerCase().includes(q);
      const catMatch = part.category.toLowerCase().includes(q);
      const oemMatch = (part.part_number || "").toLowerCase().includes(q);
      const modelMatch = (part.compatible_models || []).some((m) =>
        m.toLowerCase().includes(q)
      );

      return nameMatch || catMatch || oemMatch || modelMatch;
    });

    return NextResponse.json({ parts: filtered.slice(0, 8) });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ parts: [] });
  }
}
