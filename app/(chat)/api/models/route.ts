import { getAllGatewayModels, getCapabilities, isDemo } from "@/lib/ai/models";
import { fetchGeminiModels } from "@/lib/ai/gemini";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  const curatedCapabilities = await getCapabilities();
  const geminiModels = await fetchGeminiModels();

  if (isDemo) {
    const gatewayModels = await getAllGatewayModels();
    const models = [...gatewayModels, ...geminiModels];
    const capabilities = Object.fromEntries(
      models.map((m) => [m.id, curatedCapabilities[m.id] ?? m.capabilities])
    );

    return Response.json({ capabilities, models }, { headers });
  }

  // If not demo, we still want to expose gemini models and their capabilities
  const gatewayModels = await getAllGatewayModels();
  const models = [...gatewayModels, ...geminiModels];
  const capabilities = Object.fromEntries(
    models.map((m) => [m.id, curatedCapabilities[m.id] ?? m.capabilities])
  );

  return Response.json({ capabilities, models }, { headers });
}
