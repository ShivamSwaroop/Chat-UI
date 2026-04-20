import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const{ name, email, password} = await req.json();

    await connectDB();

    const exist = await User.findOne({ email });
    if(exist){
        return new Response("User already exists",  { status: 400 });

    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
        name,
        email,
        hashPassword: hashed,
        provider: "credentials"
    });

    return new Response("User created", { status: 201});
}
