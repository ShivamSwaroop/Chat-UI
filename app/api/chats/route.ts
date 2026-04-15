import { connectDB } from "@/lib/mongoose";
import Chat from "@/models/chat";

export async function GET() {
  try {
    await connectDB();

    const chats = await Chat.find().sort({ createdAt: -1 });

    return Response.json(chats);

  } catch (error) {
     console.error("GET /api/chats ERROR:", error);
    return Response.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}