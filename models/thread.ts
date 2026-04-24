import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
    title: { type: String},
    userId: {
        type: String,
        required: true,
        index: true
    }
    
}, { timestamps: true });

const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);

export default Thread;