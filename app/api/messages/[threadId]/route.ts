import Message from "@/models/message";
import Thread from "@/models/thread";
import { connectDB } from "@/lib/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, context: { params: Promise<{ threadId: string }> }) {
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { threadId } = await context.params;

    const thread = await Thread.findOne({
    _id: threadId,
    userId: session.user.id,
  });

  if (!thread) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 });

  return Response.json(messages);
}