import { connectDB } from "@/lib/mongoose";
import Thread from "@/models/thread";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }){
  await connectDB();
  const session = await getServerSession(authOptions);

  if(!session) return Response.json({ error: "unauthorized" }, { status: 401});

  const { title } = await req.json();

  const { id } = await params;

  const thread = await Thread.findOneAndUpdate(
    {_id: id, userId: session.user.id},
    { title },
    { new: true}
  );

  return Response.json(thread);
};

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }){
  await connectDB();
  const session = await getServerSession(authOptions);

  if(!session) return Response.json({ error: "unauthorized" }, { status: 401});

  const { id } = await params;

   const result = await Thread.deleteOne({ _id: id, userId: session.user.id});

   console.log("Deleting thread ID:", id);
   console.log("DELETE RESULT",result);

  return Response.json({ success: true});

};