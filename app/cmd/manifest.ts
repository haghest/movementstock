import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Custom Express",
    short_name: "Custom Express",

    start_url: "/cmd",

    display: "standalone",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    icons: [
      {
        src: "/cmd.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/cmd.png",
        sizes: "852x852",
        type: "image/png",
      },
    ],
  };
}
