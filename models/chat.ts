import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true}
});

const ChatSchema = new mongoose.Schema({
    title: String,
    messages: [messageSchema]
}, {timestamps: true});

const Chat = mongoose.models.Chat ||mongoose.model('Chat', ChatSchema);

export default Chat;