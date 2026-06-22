import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  return keys;
}

export function getNextGeminiKey(): string {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    return "";
  }

  // Gunakan metode acak (randomized) agar lebih tangguh terhadap Cold Start di Vercel (Serverless)
  const randomIndex = Math.floor(Math.random() * keys.length);
  const key = keys[randomIndex];
  
  console.log(`[Auto-Rotate] Menggunakan API Key ke-${randomIndex + 1} dari ${keys.length} kunci yang tersedia.`);
  return key;
}

export function getAutoRotateGeminiModel(modelId: string) {
  const apiKey = getNextGeminiKey();
  if (!apiKey) {
    throw new Error("Tidak ada GEMINI_API_KEY yang ditemukan di .env.local");
  }
  const google = createGoogleGenerativeAI({ apiKey });
  // Remove "google/" prefix if exists because ai-sdk/google expects just "gemini-1.5-pro"
  const actualModelId = modelId.startsWith("google/") ? modelId.replace("google/", "") : modelId;
  return google(actualModelId);
}

export async function fetchGeminiModels() {
  const apiKey = getNextGeminiKey();
  if (!apiKey) return [];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const json = await res.json();
    return (json.models || [])
      .filter(
        (m: any) =>
          m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")
      )
      .map((m: any) => {
        const id = m.name.replace("models/", "");
        return {
          id: `google/${id}`, // Add "google/" prefix to match routing logic
          name: m.displayName || id,
          provider: "google",
          description: m.description || "Google Gemini Model",
          gatewayOrder: [],
          reasoningEffort: id.includes("thinking") ? "high" : "none",
          capabilities: {
            tools: true,
            vision: id.includes("vision") || id.includes("1.5"),
            reasoning: id.includes("thinking") || id.includes("pro"),
          },
        };
      });
  } catch (error) {
    console.error("Gagal mengambil model gemini:", error);
    return [];
  }
}
