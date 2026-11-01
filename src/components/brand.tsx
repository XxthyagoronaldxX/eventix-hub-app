import { cn } from "@/lib/utils";

const MARK_GRADIENT_ID = "eventixhub-mark-gradient";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0 drop-shadow-sm", className)}>
      <defs>
        <linearGradient id={MARK_GRADIENT_ID} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#C026D3" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${MARK_GRADIENT_ID})`} />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M15 17h34a3 3 0 0 1 3 3v8.5a3.5 3.5 0 0 0 0 7V44a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3v-8.5a3.5 3.5 0 0 0 0-7V20a3 3 0 0 1 3-3ZM22 24h14a2 2 0 0 1 0 4h-10v2.5h7a2 2 0 0 1 0 4h-7V36h10a2 2 0 0 1 0 4H22a2 2 0 0 1-2-2V26a2 2 0 0 1 2-2Z"
      />
      <g fill={`url(#${MARK_GRADIENT_ID})`}>
        <circle cx="43.5" cy="23" r="1.25" />
        <circle cx="43.5" cy="28.67" r="1.25" />
        <circle cx="43.5" cy="34.33" r="1.25" />
        <circle cx="43.5" cy="40" r="1.25" />
      </g>
    </svg>
  );
}

interface BrandProps {
  className?: string;
  onDarkBackground?: boolean;
}

export function Brand({ className, onDarkBackground = false }: BrandProps) {
  return (
    <span className={cn("flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <BrandMark className={cn(onDarkBackground && "rounded-[10px] ring-1 ring-white/30")} />
      <span className="text-base">
        Eventix
        <span
          className={
            onDarkBackground
              ? "text-white/80"
              : "bg-gradient-to-r from-indigo-500 to-fuchsia-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-fuchsia-400"
          }
        >
          Hub
        </span>
      </span>
    </span>
  );
}
