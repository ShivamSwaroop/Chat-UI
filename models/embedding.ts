import mongoose from "mongoose";

const embeddingSchema = new mongoose.Schema({
    userId: String,
    documentId: String,
    text: String,
    embedding: [Number]
});

const Embedding = mongoose.models.Embedding || mongoose.model("Embedding", embeddingSchema);

export default Embedding;