import { connectDB } from "@/lib/mongoose";
import Chat from "@/models/chat";

export const revalidate = 0;

export async function POST(req: Request){
    try {
        await connectDB();
        const body = await req.json();
        const userMessage = body.message;
        const chatId = body.chatId;

      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: `You are Echo, a smart AI assistant.
                Format your answers clearly:
                - Use headings where helpful
                - Use bullet points for lists
                - Keep paragraphs short
                - Avoid large dense text blocks
                - Make responses easy to read on screen`,
              },
              { role: "user", content: userMessage },
            ],
            stream: true,
          }),
        },
      );
      const encoder = new TextEncoder();

      let fullResponse = "";
      let chat: any;
  return new Response(new ReadableStream({
    async start(controller){
      const reader = groqResponse.body?.getReader();
      const decoder = new TextDecoder();

      if(!reader) return;

      let buffer = "";

      while(true){ 
        const { done, value } = await reader.read();
        if(done) break;

        buffer += decoder.decode(value, { stream: true});

        const parts = buffer.split("data:");

        buffer = parts.pop() || "";

        for(let part of parts){
          const data = part.trim();
          
          if(!data || data === "[DONE]") continue;

          try{
            const json = JSON.parse(data);
            const text = json.choices?.[0]?.delta?.content || "";

            if(text){
              fullResponse += text; 
              controller.enqueue(encoder.encode(text));
            }
          }catch(e){ }
        }
      }
      try{
        if(chatId){
          chat = await Chat.findById(chatId);

          if(chat){
            chat.messages.push(
              { content: userMessage, role: "user" },
              { content: fullResponse, role: "assistant" }
            );
            await chat.save();
          }
        }else{
          chat = await Chat.create({
            title: userMessage.slice(0, 30),
            messages: [
              { content: userMessage, role: "user"},
              { content: fullResponse, role: "assistant"}
            ]
          })
        }
      }catch(error){
        console.error("DB save Error:", error);
      }
      controller.close();
      controller.enqueue(encoder.encode(`_CHAT_ID_: ${chat?._id}`))
    }
  }),
{
  headers: {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache"
  }
});
    }catch(error){
      console.error("API error: " , error);
      return new Response("Error", {status: 500})
    }
  };