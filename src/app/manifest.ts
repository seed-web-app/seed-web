import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suzuki Mauritius - Customer Network",
    short_name: "Suzuki MU",
    description: "Private customer network for Suzuki owners to browse parts and contact the dealer.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f5f6f7",
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
