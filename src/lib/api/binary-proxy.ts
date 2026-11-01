import "server-only";
import { apiRequestRaw, ApiError, type ApiRequestOptions } from "@/lib/api/api-client";
import { getActiveOrganization } from "@/lib/workspace";

const FORWARDED_HEADERS = ["content-type", "content-length", "content-disposition"];

export async function forwardBinaryFromApi(
  path: string,
  options: Omit<ApiRequestOptions, "organizationId"> = {},
): Promise<Response> {
  const organization = await getActiveOrganization();
  if (!organization) {
    return Response.json({ message: "Nenhuma organização ativa" }, { status: 403 });
  }
  try {
    const apiResponse = await apiRequestRaw(path, { ...options, organizationId: organization.id });
    const headers = new Headers({ "cache-control": "private, no-store" });
    for (const headerName of FORWARDED_HEADERS) {
      const headerValue = apiResponse.headers.get(headerName);
      if (headerValue) {
        headers.set(headerName, headerValue);
      }
    }
    return new Response(apiResponse.body, { status: apiResponse.status, headers });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
