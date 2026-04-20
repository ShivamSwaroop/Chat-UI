"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { BsGithub } from "react-icons/bs";

export default function Loginpage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    async function handleLogin(){
        const res = await signIn("credentials", { email, password, redirect: false});

        if(!res?.error){
            router.push("/");
        }else{
            alert(res.error);
        }
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#343541] text-white px-4">
        <div className="w-full max-w-sm bg-[#202123] border border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
          <h2 className="text-xl font-semibold text-center">Welcome back</h2>

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 bg-[#2a2b32] border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 bg-[#2a2b32] border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-2.5 rounded-md font-medium"
          >
            Login
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 h-px bg-gray-700" />
            OR
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <button
            onClick={() => signIn("google", {callbackUrl: "/"})}
            className="w-full bg-[#2a2b32] hover:bg-[#3a3b42] transition p-2.5 rounded-md flex items-center justify-center gap-2"
          >
            <FcGoogle/>Continue with Google
          </button>

          <button
            onClick={() => signIn("github", {callbackUrl: "/"})}
            className="w-full bg-[#2a2b32] hover:bg-[#3a3b42] transition p-2.5 rounded-md flex items-center justify-center gap-2"
          >
            <BsGithub/>Continue with GitHub
          </button>

          <div className="text-sm text-gray-400 text-center pt-2">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );


}