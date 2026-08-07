import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Express",
  icons: {
    icon: "/cmd.png",
  },
};

export default function CmdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
