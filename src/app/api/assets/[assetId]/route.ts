import { forwardBinaryFromApi } from "@/lib/api/binary-proxy";

export async function GET(_request: Request, { params }: RouteContext<"/api/assets/[assetId]">) {
  const { assetId } = await params;
  return forwardBinaryFromApi(`/org/assets/${assetId}/content`);
}
