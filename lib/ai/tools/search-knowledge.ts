import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/db/schema";
import { generateQueryEmbedding } from "../rag";
import { sql } from "drizzle-orm";

export const searchKnowledgeBase = tool({
  description: "Cari dokumen, artikel, file, atau pengetahuan spesifik dari memori / database RAG. Gunakan tool ini jika pengguna menanyakan tentang dokumen yang pernah mereka upload sebelumnya.",
  parameters: z.object({
    query: z.string().describe("Pertanyaan spesifik atau kata kunci untuk dicari di database"),
  }),
  execute: async ({ query }) => {
    try {
      // 1. Ubah query menjadi vektor
      const queryVector = await generateQueryEmbedding(query);
      
      // 2. Format vektor ke string array untuk PostgreSQL
      const vectorString = `[${queryVector.join(",")}]`;

      // 3. Pencarian Cosine Similarity (<=>)
      // Mengambil 3 chunk paling mirip (limit 3)
      const results = await db
        .select({
          content: knowledgeBase.content,
          metadata: knowledgeBase.metadata,
          similarity: sql<number>`1 - (${knowledgeBase.embedding} <=> ${vectorString}::vector)`.as('similarity'),
        })
        .from(knowledgeBase)
        .orderBy(sql`${knowledgeBase.embedding} <=> ${vectorString}::vector`)
        .limit(3);

      if (results.length === 0) {
        return { message: "Tidak ada informasi yang relevan di memori dokumen." };
      }

      // 4. Mengembalikan hasil ke AI
      return {
        results: results.map((r) => ({
          content: r.content,
          metadata: r.metadata,
          similarityScore: r.similarity,
        })),
      };
    } catch (error) {
      console.error("Gagal melakukan pencarian RAG:", error);
      return { error: "Terjadi kesalahan saat mencari dokumen di database." };
    }
  },
});
