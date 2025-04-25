import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced AI Charting Suite",
  description: "Next-gen charting platform with AI, custom strategies, and algo trading features",
};

export default function AdvancedChartsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
