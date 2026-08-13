import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movement Stock",
    short_name: "Movement Stock",

    start_url: "/",

    display: "standalone",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    orientation: "portrait",

    icons: [
      {
        src: "/movementstock.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/movementstock.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/movementstock.png",
        sizes: "852x852",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
