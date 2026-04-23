import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    userId: String,
    fileName: String,
    content: String,
}, { timestamps: true });

const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);

export default Document;