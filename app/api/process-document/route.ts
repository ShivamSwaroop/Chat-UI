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

export async function POST(req: Request){
    await connectDB();

    const { documentId } = await req.json();

    const doc = await Document.findById(documentId);

    if(!doc){
        return Response.json({ error: "Document not found" }, { status: 404});
    }

    const chunks = chunkText(doc.content);

   const embeddings = await Promise.all(
     chunks.map(async (chunk) => {
       const res = await hf.featureExtraction({
         model: "sentence-transformers/all-MiniLM-L6-v2",
         inputs: chunk,
       });

       return {
         userId: doc.userId,
         documentId: doc._id,
         text: chunk,
         embedding: normalizeEmbedding(res)
       };
     }),
   );
  await Embedding.insertMany(embeddings);

  console.log("Processing document:", documentId);

  return Response.json({ success: true});
}