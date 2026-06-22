// lib/ai/models.ts
// Updated: 22 Juni 2026
// Sumber validasi: ai.google.dev/gemini-api/docs/models (diperbarui 15 Jun 2026)
//                  ai.google.dev/gemini-api/docs/deprecations
//                  @ai-sdk/google v3.0.83 (latest per 17 Jun 2026)

// CATATAN PENTING — RIWAYAT PERUBAHAN:
// ❌ DIHAPUS: google/gemini-2.0-flash → SHUT DOWN 1 Juni 2026 (semua request → 404)
// ❌ DIHAPUS: google/gemini-2.5-flash-thinking-exp → ID tidak ada di API.
//    Thinking kini BUILT-IN di gemini-2.5-flash (gunakan thinkingBudget via providerOptions)
//    dan semua model Gemini 3.x adalah reasoning model (gunakan thinkingLevel).
// ⚠️  PERHATIAN: google/gemini-2.5-flash dijadwalkan shutdown 16 Oktober 2026.
//    Mulai rencanakan migrasi ke gemini-3.5-flash atau gemini-3.1-flash-lite.

// Default diperbarui ke Gemini 3.5 Flash (GA, Stable, tanpa tanggal shutdown)
export const DEFAULT_CHAT_MODEL = "google/gemini-3.5-flash";

// Title model diperbarui ke Gemini 3.5 Flash agar tidak terdampak shutdown 2.5-flash (16 Okt 2026)
export const titleModel = {
  id: "google/gemini-3.5-flash",
  name: "Gemini 3.5 Flash",
  provider: "google",
  description: "Fast model for title generation",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  // Gemini 2.5: dikontrol via providerOptions.google.thinkingConfig.thinkingBudget (integer)
  // Gemini 3.x: dikontrol via providerOptions.google.thinkingConfig.thinkingLevel
  //   ("minimal" | "low" | "medium" | "high")
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

export const chatModels: ChatModel[] = [
  // ─── GEMINI 3.x FAMILY ─ Terbaru (per Juni 2026) ────────────────────────────
  {
    id: "google/gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "google",
    description:
      "Model Flash terbaru & terpintar — frontier performance untuk agentic tasks & coding (GA, Stable)",
    reasoningEffort: "medium", // default thinkingLevel Gemini 3.5 adalah "medium"
  },
  {
    id: "google/gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    description:
      "Model Gemini 3 paling hemat & cepat — optimal untuk volume tinggi & klasifikasi (GA, Stable)",
    reasoningEffort: "none",
  },

  // ─── GEMINI 2.5 FAMILY ────────────────────────────────────────────────────────
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description:
      "Model paling canggih untuk reasoning & coding kompleks (Stable)",
    reasoningEffort: "high",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description:
      "Hybrid reasoning terbaik untuk price-performance (⚠️ shutdown: 16 Okt 2026 → migrasikan ke 3.5 Flash)",
    reasoningEffort: "medium",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    provider: "google",
    description:
      "Tercepat & termurah di keluarga 2.5 — untuk routing, ekstraksi, agentic volume tinggi (Stable)",
    reasoningEffort: "none",
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// MODEL YANG DIHAPUS — JANGAN DITAMBAHKAN KEMBALI
// ─────────────────────────────────────────────────────────────────────────────────
// ❌ "google/gemini-2.0-flash"
//    → SHUT DOWN 1 Juni 2026. Semua request ke model ini mengembalikan HTTP 404.
//    → Migrasi: gunakan "google/gemini-2.5-flash" atau "google/gemini-3.5-flash".
//
// ❌ "google/gemini-2.5-flash-thinking-exp"
//    → Endpoint ini tidak ada / tidak pernah valid sebagai production ID.
//    → Thinking kini built-in. Untuk thinking di Gemini 2.5:
//         providerOptions: { google: { thinkingConfig: { thinkingBudget: 8000 } } }
//    → Untuk thinking di Gemini 3.x:
//         providerOptions: { google: { thinkingConfig: { thinkingLevel: "high" } } }
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Menentukan kapabilitas berdasarkan model ID.
 * - Semua model aktif mendukung tools (function calling) dan vision.
 * - Gemini 3.x (kecuali Lite) adalah reasoning model by default.
 * - Gemini 2.5 Pro memiliki reasoning mendalam.
 * - Model Lite dioptimalkan untuk kecepatan & biaya, bukan reasoning mendalam.
 */
function getGeminiCapabilities(modelId: string): ModelCapabilities {
  const id = modelId.replace("google/", "");
  const isLite = id.includes("lite");
  const isPro = id.includes("pro");
  // Semua model dengan prefix "gemini-3" adalah Gemini 3.x (reasoning models)
  const isGemini3x = /^gemini-3/.test(id);

  return {
    tools: true, // Semua model aktif mendukung Function Calling
    vision: true, // Semua model aktif mendukung multimodal input
    // Reasoning: Gemini 3.x non-Lite built-in reasoning; 2.5 Pro deep reasoning
    reasoning: isPro || (isGemini3x && !isLite),
  };
}

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  const all = [...chatModels];
  return Object.fromEntries(all.map((m) => [m.id, getGeminiCapabilities(m.id)]));
}

export const isDemo = process.env.IS_DEMO === "1";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

// Allow any google/ prefixed model ID (dynamically fetched from Gemini API)
export function isAllowedModelId(id: string): boolean {
  return id.startsWith("google/");
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
