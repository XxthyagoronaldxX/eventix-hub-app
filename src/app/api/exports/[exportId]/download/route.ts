import { forwardBinaryFromApi } from "@/lib/api/binary-proxy";

export async function GET(_request: Request, { params }: RouteContext<"/api/exports/[exportId]/download">) {
  const { exportId } = await params;
  return forwardBinaryFromApi(`/org/exports/${exportId}/download`);
}
