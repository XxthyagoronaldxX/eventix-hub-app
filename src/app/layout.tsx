import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "EventixHub",
    template: "%s · EventixHub",
  },
  description: "Gestão de eventos, bingos e tickets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <Toaster position="bottom-right" richColors={false} closeButton />
      </body>
    </html>
  );
}
