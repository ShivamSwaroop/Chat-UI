import { NextRequest } from "next/server";
import Tesseract from "tesseract.js";
import { connectDB } from "@/lib/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Document from "@/models/document";

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("File recieved:", file.name);

    let extractedText = "";

    if (file.type === "application/pdf") {
      const pdfParseModule: any = await import("pdf-parse/lib/pdf-parse.js");

      const pdfParse = pdfParseModule.default || pdfParseModule;

      const data = await pdfParse(buffer);
      extractedText = data.text;
      console.log("PDF PARSER TYPE:", typeof pdfParse);
    } else if (file.type.startsWith("image/")) {
      const result = await Tesseract.recognize(buffer, "eng");
      extractedText = result.data.text;
    } else {
      extractedText = buffer.toString("utf-8");
    }
    console.log("Extracted:", extractedText.slice(0, 200));

    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await Document.create({
      userId: session.user.id,
      fileName: file.name,
      content: extractedText,
    });

    await fetch(`${https://chat-ui-chi-five.vercel.app/}/api/process-document`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ documentId: doc._id }),
    });

    return Response.json({ success: true, fileName: file.name });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return Response.json(
      { error: err?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
