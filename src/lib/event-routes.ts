export function eventPath(eventId: string, section = ""): string {
  const basePath = `/events/${encodeURIComponent(eventId)}`;
  return section ? `${basePath}/${section}` : basePath;
}

export const eventRoutes = {
  overview: (eventId: string) => eventPath(eventId),
  tickets: (eventId: string) => eventPath(eventId, "tickets"),
  batch: (eventId: string, batchId: string) => eventPath(eventId, `batches/${encodeURIComponent(batchId)}`),
  payments: (eventId: string) => eventPath(eventId, "payments"),
  checkIn: (eventId: string) => eventPath(eventId, "check-in"),
  draw: (eventId: string) => eventPath(eventId, "draw"),
  settings: (eventId: string) => eventPath(eventId, "settings"),
};
