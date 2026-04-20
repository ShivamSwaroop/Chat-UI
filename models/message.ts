import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Thread",
        required: true
    },

    role: {
        type: String,
        enum: ["user", "assistant"]
    },

    content: String
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;