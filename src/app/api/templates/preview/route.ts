import { forwardBinaryFromApi } from "@/lib/api/binary-proxy";

export async function POST(request: Request) {
  return forwardBinaryFromApi("/org/templates/preview", {
    method: "POST",
    body: await request.json(),
  });
}
