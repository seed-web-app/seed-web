import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suzuki Mauritius - Customer Network",
    short_name: "Suzuki MU",
    description: "Official customer network & auto-parts marketplace for Suzuki owners in Mauritius.",
    start_url: "/home",
    display: "standalone",
    background_color: "#eaeded",
    theme_color: "#131921",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
