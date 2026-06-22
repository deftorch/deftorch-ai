import { getNextGeminiKey } from "./gemini";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Memecah teks besar menjadi potongan-potongan kecil (Chunks)
 * @param text Teks asli dari dokumen
 * @param chunkSize Jumlah karakter maksimal per potongan
 * @param overlap Jumlah karakter yang tumpang tindih antar potongan
 */
export function chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}

/**
 * Menghasilkan Vector Embedding dari teks menggunakan Gemini text-embedding-004
 * @param text Potongan teks yang ingin diubah menjadi vektor
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getNextGeminiKey();
  
  const payload = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text }],
    },
  };

  const response = await fetch(`${API_BASE_URL}/models/text-embedding-004:embedContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menghasilkan embedding: ${errorText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Menghasilkan vektor untuk pencarian kemiripan
 * Berguna saat user bertanya, pertanyaannya diubah jadi vektor dulu.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  // text-embedding-004 mendukung taskType
  const apiKey = getNextGeminiKey();
  
  const payload = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text: query }],
    },
    taskType: "RETRIEVAL_QUERY",
  };

  const response = await fetch(`${API_BASE_URL}/models/text-embedding-004:embedContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menghasilkan query embedding: ${errorText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}
