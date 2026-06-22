import { NextResponse } from "next/server";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

import { auth } from "@/app/(auth)/auth";

const ALLOWED_TYPES = [
  // Images
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
  // Documents & Data
  "application/pdf", "text/plain", "text/csv", "text/markdown", "application/rtf", "text/xml", "application/json",
  // Audio
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/flac", "audio/aac", "audio/x-aiff",
  // Video
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv", "video/mpeg", "video/x-flv"
];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "File size should be less than 50MB",
    })
    .refine((file) => {
      const allowedExtensions = ['.md', '.csv', '.json', '.xml', '.py', '.js', '.ts', '.html', '.css', '.java', '.cpp', '.c', '.go', '.php', '.sh', '.docx', '.xlsx'];
      const isExtensionAllowed = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      return ALLOWED_TYPES.includes(file.type) || isExtensionAllowed;
    }, {
      message: "File type is not supported",
    }),
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    // Menambahkan timestamp agar nama file unik
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let finalBuffer = fileBuffer;
    let finalContentType = file.type;
    let finalSafeName = safeName;
    const lowerName = filename.toLowerCase();

    // -- PARSING MAGIC UNTUK WORD & EXCEL --
    try {
      if (lowerName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        finalBuffer = Buffer.from(result.value, "utf-8");
        finalContentType = "text/plain";
        finalSafeName = safeName.replace(/\.docx$/i, ".txt");
      } else if (lowerName.endsWith(".xlsx")) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        if (firstSheetName) {
          const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
          finalBuffer = Buffer.from(csvData, "utf-8");
          finalContentType = "text/csv";
          finalSafeName = safeName.replace(/\.xlsx$/i, ".csv");
        }
      }
    } catch (parseError) {
      console.warn("Gagal mem-parsing docx/xlsx, melanjutkan upload mentah:", parseError);
    }

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: finalSafeName,
          Body: finalBuffer,
          ContentType: finalContentType,
        })
      );

      // Gunakan public domain bucket Anda. Pastikan tidak diakhiri dengan /
      const r2Domain = process.env.R2_PUBLIC_DOMAIN || `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const url = `${r2Domain}/${finalSafeName}`;

      return NextResponse.json({
        url,
        pathname: finalSafeName,
        contentType: finalContentType,
      });
    } catch (_error) {
      console.error("S3 Upload Error:", _error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
