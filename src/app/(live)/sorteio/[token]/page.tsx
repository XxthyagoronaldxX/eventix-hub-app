import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicDrawSnapshot } from "@/actions/public-draw-actions";
import { Brand } from "@/components/brand";
import { PublicDrawBoard } from "@/components/draws/public-draw-board";

export const metadata: Metadata = { title: "Sorteio ao vivo" };

export default async function PublicDrawPage({ params }: PageProps<"/sorteio/[token]">) {
  const { token } = await params;
  const snapshot = await loadPublicDrawSnapshot(token, []);
  if (!snapshot.ok) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(99_102_241/0.18),transparent_55%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Brand />
        <span className="flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-500">
          <span className="size-2 animate-pulse rounded-full bg-rose-500" /> AO VIVO
        </span>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-12">
        <PublicDrawBoard token={token} initialView={snapshot.view} />
      </main>
    </div>
  );
}
