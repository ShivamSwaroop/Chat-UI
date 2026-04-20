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

export async function PATCH(req: Request, { params }: { params: {id: string} }){
  await connectDB();
  const session = await getServerSession(authOptions);

  if(!session) return Response.json({ error: "unauthorized" }, { status: 401});

  const { title } = await req.json();

  const thread = await Thread.findOneAndUpdate(
    {_id: params.id, userId: session.user.id},
    { title },
    { new: true}
  );

  return Response.json(thread);
};

export async function DELETE(req: Request, { params }: { params: {id: string} }){
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if(!session) return Response.json({ error: "unauthorized" }, { status: 401});

  await Thread.deleteOne({ _id: params.id, userId: session.user.id});

  return Response.json({ success: true});

};