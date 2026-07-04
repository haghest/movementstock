import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movement Stock",
    short_name: "Movement Stock",
    description: "Ubah Daily Sales menjadi Rumus Movement Stock.",

    start_url: "/",

    display: "standalone",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    orientation: "landscape",

    icons: [
      {
        src: "/favicon.ico",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
