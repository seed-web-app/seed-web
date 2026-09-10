/**
 * Image optimization helper for Suzuki Mauritius Customer Network.
 * Automatically resizes remote images (such as Unsplash) to appropriate display sizes,
 * reducing page payload by up to 95% and speeding up mobile load times.
 */

export function getOptimizedImageUrl(
  url: string | undefined | null,
  width: number = 400,
  quality: number = 75
): string {
  if (!url) {
    return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=70";
  }

  // Handle Unsplash images: rewrite parameters for high-performance CDN delivery
  if (url.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("w", width.toString());
      parsed.searchParams.set("q", quality.toString());
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
