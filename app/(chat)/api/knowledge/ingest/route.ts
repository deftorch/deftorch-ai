import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/db/schema";
import { chunkText, generateEmbedding } from "@/lib/ai/rag";
import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId, content, metadata } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // 1. Pecah dokumen menjadi potongan kecil (chunks)
    const chunks = chunkText(content, 1000, 200);

    // 2. Lakukan embedding untuk setiap chunk secara paralel
    const recordsToInsert = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await generateEmbedding(chunk);
        
        return {
          documentId: documentId || `doc_${Date.now()}`,
          metadata: {
            ...metadata,
            chunkIndex: index,
            totalChunks: chunks.length,
          },
          content: chunk,
          embedding, // Format pgvector (array of numbers, Drizzle toDriver handles stringification)
        };
      })
    );

    // 3. Simpan ke database
    // Drizzle akan menggunakan custom type vector yang sudah kita buat
    if (recordsToInsert.length > 0) {
      await db.insert(knowledgeBase).values(recordsToInsert);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memecah dan menyimpan ${chunks.length} potongan vektor ke database.`,
    });
  } catch (error) {
    console.error("Gagal melakukan ingesi dokumen:", error);
    return NextResponse.json(
      { error: "Gagal memproses dan menyimpan dokumen ke Knowledge Base." },
      { status: 500 }
    );
  }
}
