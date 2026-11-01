const DEFAULT_REFRESH_SECONDS = 3;

export function AutoRefresh({ seconds = DEFAULT_REFRESH_SECONDS }: { seconds?: number }) {
  return <meta httpEquiv="refresh" content={String(seconds)} />;
}
