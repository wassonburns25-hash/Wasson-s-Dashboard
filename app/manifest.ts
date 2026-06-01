import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wasson's Dashboard",
    short_name: "Wasson's",
    description:
      "Personal life dashboard — training, academics, goals, finance.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0c",
    theme_color: "#0a0a0c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
