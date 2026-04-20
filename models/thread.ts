import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
    title: { type: String},
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
    
}, { timestamps: true });

const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);

export default Thread;