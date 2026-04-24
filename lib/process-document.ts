import { connectDB } from "@/lib/mongoose";
import Document from "@/models/document";
import Embedding from "@/models/embedding";
import { HfInference } from "@huggingface/inference";
import { normalizeEmbedding } from "@/lib/embedding";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

function chunkText(text: string, size = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export async function processDocument(documentId: string) {
  await connectDB();

  const doc = await Document.findById(documentId);

  if (!doc) {
    console.log("Document not found");
    return;
  }

  const chunks = chunkText(doc.content);

  console.log("Chunks created:", chunks.length);

  const embeddings = await Promise.all(
    chunks.map(async (chunk, index) => {
      console.log(`Embedding chunk ${index + 1}/${chunks.length}`);

      const res = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: chunk,
      });

      return {
        userId: doc.userId,
        documentId: doc._id,
        text: chunk,
        embedding: normalizeEmbedding(res),
      };
    })
  );

  await Embedding.insertMany(embeddings);

  console.log("Processing document DONE:", documentId);
}