"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { FLASH_KEYS, type Flash } from "@/lib/flash";

const LINK_TOAST_DURATION_MS = 30_000;

function showFlashToasts({ notice, error, link }: Flash) {
  if (error) {
    toast.error(error, { id: `flash-error-${error}` });
  }
  if (notice) {
    toast.success(notice, {
      id: `flash-notice-${notice}`,
      description: link ? "Link de desenvolvimento (o e-mail também aparece no log da API)." : undefined,
      duration: link ? LINK_TOAST_DURATION_MS : undefined,
      action: link
        ? {
            label: "Copiar link",
            onClick: () => {
              void navigator.clipboard.writeText(link).then(() => toast.success("Link copiado."));
            },
          }
        : undefined,
    });
  }
}

export function FlashNotices({ flash }: { flash: Flash }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { notice, error, link } = flash;

  useEffect(() => {
    if (!notice && !error) return;
    showFlashToasts({ notice, error, link });

    const remainingQuery = new URLSearchParams(searchParams.toString());
    for (const key of FLASH_KEYS) remainingQuery.delete(key);
    const queryString = remainingQuery.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`, { scroll: false });
  }, [notice, error, link, pathname, router, searchParams]);

  return null;
}
