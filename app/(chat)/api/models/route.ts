import { getCapabilities } from "@/lib/ai/models";
import { fetchGeminiModels } from "@/lib/ai/gemini";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  };

  const [geminiModels, capabilities] = await Promise.all([
    fetchGeminiModels(),
    getCapabilities(),
  ]);

  const mergedCapabilities = {
    ...capabilities,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...Object.fromEntries(geminiModels.map((m: any) => [m.id, m.capabilities])),
  };

  return Response.json(
    { capabilities: mergedCapabilities, models: geminiModels },
    { headers }
  );
}
