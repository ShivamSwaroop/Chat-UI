"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignup() {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      return setError("All fields are required");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      router.push("/login");
    } else {
      setError("Signup failed. Try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#343541] text-white px-4">
      <div className="w-full max-w-sm bg-[#202123] border border-gray-700 rounded-2xl p-7 space-y-6 shadow-xl">

        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">Create your account</h2>
          <p className="text-sm text-gray-400">Start chatting with Echo</p>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        <div className="space-y-4">
          <input
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[#2a2b32] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 bg-[#2a2b32] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 bg-[#2a2b32] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2.5 bg-[#2a2b32] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] transition p-2.5 rounded-md font-medium"
        >
          Create Account
        </button>

        <div className="text-sm text-gray-400 text-center pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}