"use client";

import { CopyWidget } from "@/components/copy-widget";

export default function CmdWidgetPage() {
  return (
    <main className="min-h-screen bg-background p-2 max-w-md mx-auto w-full flex flex-col justify-start">
      <CopyWidget standalone={true} className="border-none shadow-none" />
    </main>
  );
}
