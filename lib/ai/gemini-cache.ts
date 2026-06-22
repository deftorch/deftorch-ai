import { getNextGeminiKey } from "./gemini";

// Base URL untuk Google Generative Language API
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Mengunggah file besar (Video/PDF) ke Google File API untuk keperluan Caching
 */
export async function uploadToGoogleFileAPI(
  fileBuffer: Buffer,
  mimeType: string,
  displayName: string
) {
  const apiKey = getNextGeminiKey();
  
  // 1. Inisialisasi Upload (Resumable)
  const initResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": fileBuffer.length.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { displayName } }),
    }
  );

  if (!initResponse.ok) {
    throw new Error("Gagal inisialisasi upload ke Google File API");
  }

  const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("Tidak mendapatkan Upload URL dari Google");
  }

  // 2. Upload Bytes (Kirim data file)
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": fileBuffer.length.toString(),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("Gagal mengunggah bytes ke Google File API");
  }

  const result = await uploadResponse.json();
  // Mengembalikan URI file yang sudah tersimpan di server Google, contoh: 'files/8a9b0c1d2e3f4'
  return result.file;
}

/**
 * Membuat Context Cache dengan durasi tertentu (TTL) untuk file yang sudah diunggah
 */
export async function createContextCache(
  modelId: string,
  systemInstruction: string,
  fileUri: string,
  mimeType: string,
  ttlSeconds: number = 3600 // Default 1 jam
) {
  const apiKey = getNextGeminiKey();
  
  // Menyesuaikan format modelId (Google API mengharapkan 'models/gemini-1.5-pro')
  const formattedModelId = modelId.startsWith("google/") 
    ? `models/${modelId.replace("google/", "")}`
    : `models/${modelId}`;

  const ttlDuration = `${ttlSeconds}s`;

  const payload = {
    model: formattedModelId,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: mimeType,
              fileUri: fileUri,
            },
          },
        ],
      },
    ],
    ttl: ttlDuration,
  };

  const response = await fetch(`${API_BASE_URL}/cachedContents?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gagal membuat Context Cache: ${JSON.stringify(err)}`);
  }

  return await response.json();
}
