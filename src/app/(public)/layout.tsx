import { CalendarCheck, Grid3x3, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: "Eventos, bingos e tickets da sua organização em um só lugar." },
  { icon: Grid3x3, text: "Builder visual: use a sua arte e posicione os números." },
  { icon: ShieldCheck, text: "Cartelas únicas, com código e QR Code." },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgb(255_255_255/0.12),transparent_40%)]"
        />
        <Brand className="relative" onDarkBackground />
        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Do convite à cartela impressa, sem planilhas.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-white/85">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/60">© EventixHub</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-8">
          <Brand className="lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
