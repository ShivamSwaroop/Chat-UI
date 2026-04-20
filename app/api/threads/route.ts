import { connectDB } from "@/lib/mongoose";
import Thread from "@/models/thread";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },{ status: 401 }
      );
    }

    const userId = session.user.id;

    const threads = await Thread.find({ userId })
      .sort({ updatedAt: -1 });

    return Response.json(threads);

  } catch (error) {
    console.error("GET /api/threads ERROR:", error);
    return Response.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}