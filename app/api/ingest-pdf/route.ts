import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const chunkSize = parseInt(formData.get("chunkSize") as string || "1000");
    const chunkOverlap = parseInt(formData.get("chunkOverlap") as string || "200");
    const embeddingModel = (formData.get("embeddingModel") as string) || "gemini-embedding-001";

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing API keys." }, { status: 500 });
    }

    // 1. Read file buffer and parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF." }, { status: 400 });
    }

    // 2. Chunking logic
    const chunks: string[] = [];
    let currentIndex = 0;
    while (currentIndex < rawText.length) {
      // Find a safe end point for the chunk
      let end = currentIndex + chunkSize;
      if (end >= rawText.length) {
        chunks.push(rawText.slice(currentIndex));
        break;
      }

      // Try to end at a newline or space if possible
      let safeEnd = rawText.lastIndexOf("\n", end);
      if (safeEnd <= currentIndex) {
        safeEnd = rawText.lastIndexOf(" ", end);
      }
      if (safeEnd > currentIndex) {
        end = safeEnd;
      }

      chunks.push(rawText.slice(currentIndex, end));
      currentIndex = end - chunkOverlap;
      if (currentIndex < 0) currentIndex = 0; // prevent infinite loop
      if (end - chunkOverlap <= currentIndex && end > currentIndex) {
        currentIndex = end; // fallback if overlap makes no progress
      }
    }

    // 3. Initialize Clients
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX_NAME || "serene-knowledge";
    const index = pc.Index(indexName);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 4. Generate Embeddings & Push to Pinecone
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const textChunk = chunks[i].trim();
      if (!textChunk) continue;

      const res = await ai.models.embedContent({
        model: embeddingModel,
        contents: textChunk
      });

      const embedding = res.embeddings?.[0]?.values;
      if (!embedding) {
        console.warn(`Failed to generate embedding for chunk ${i}`);
        continue;
      }

      vectors.push({
        id: `pdf_${file.name}_${Date.now()}_chunk_${i}`,
        values: embedding,
        metadata: {
          text: textChunk,
          source: file.name
        }
      });
    }

    if (vectors.length > 0) {
      await index.upsert(vectors);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully ingested ${vectors.length} chunks from ${file.name}.` 
    });

  } catch (error: any) {
    console.error("PDF Ingestion Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF." }, { status: 500 });
  }
}
