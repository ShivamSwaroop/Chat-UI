import Message from "@/models/message";
import { connectDB } from "@/lib/mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
    const { threadId } = await params;
    await connectDB();

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 });

  return Response.json(messages);
}