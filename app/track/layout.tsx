import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Express Tracking | Ticket to the Moon",
  description: "Track your custom express bag order status in real-time.",
  icons: {
    icon: "/cmd-favicon.ico",
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
