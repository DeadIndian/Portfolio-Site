import { getSignal, isProvider } from "../../../../lib/signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!isProvider(provider)) {
    return Response.json(
      {
        status: "unavailable",
        source: "Portfolio",
        updatedAt: null,
        data: null,
        message: "Unknown signal provider.",
      },
      { status: 404, headers },
    );
  }
  return Response.json(await getSignal(provider), { headers });
}
