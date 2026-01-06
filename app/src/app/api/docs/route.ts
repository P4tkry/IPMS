import { generateOpenApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";

export async function GET() {
  const spec = generateOpenApiSpec();
  return Response.json(spec);
}
