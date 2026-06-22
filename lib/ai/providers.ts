// lib/ai/providers.ts
// Updated: 22 Juni 2026
// PERUBAHAN: getTitleModel() diperbarui dari gemini-2.5-flash → gemini-3.5-flash
//             untuk menghindari dampak shutdown gemini-2.5-flash pada 16 Oktober 2026.

import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { getAutoRotateGeminiModel } from "./gemini";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  return getAutoRotateGeminiModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  // Diperbarui dari gemini-2.5-flash (shutdown 16 Okt 2026) → gemini-3.5-flash (Stable, no EOL)
  return getAutoRotateGeminiModel("google/gemini-3.5-flash");
}
