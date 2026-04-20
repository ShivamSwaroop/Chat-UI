import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongoose";
import User from "@/models/user";

export const authOptions =  {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: {},
                password: {}
            },
            async authorize(credentials: any){
                await connectDB();
                const user = await User.findOne({ email: credentials.email});
                if(!user) throw new Error("user not found");

                const isMatch = await bcrypt.compare(credentials.password, user.hashPassword);

                if(!isMatch) throw new Error("Invalid password");

                return{
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image
                };
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!
        }),

    ],
    pages:{ signIn: "/login"},

    callbacks: {
        async signIn({ user, account}: any) {
            await connectDB();

            const existing = await User.findOne({ email: user.email });

            if(!existing) {
                await User.create({
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    provider: account.provider
                });
            }
            return true;
        },

        async session({ session, token }: any) {
            if(session.user){
                session.user.id = token.id;
            }
            return session;
        },
         async jwt({ token, user }: any){
        if(user){
            token.id = user.id
        }
        return token;
    }
    
    },
    secret: process.env.NEXTAUTH_SECRET
};