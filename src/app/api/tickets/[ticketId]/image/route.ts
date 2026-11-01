import { forwardBinaryFromApi } from "@/lib/api/binary-proxy";

export async function GET(_request: Request, { params }: RouteContext<"/api/tickets/[ticketId]/image">) {
  const { ticketId } = await params;
  return forwardBinaryFromApi(`/org/tickets/${ticketId}/image`);
}
