import { connectDB } from "@/lib/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Thread from "@/models/thread";
import Message from "@/models/message";
import Embedding from "@/models/embedding";
import { HfInference } from "@huggingface/inference";
import { normalizeEmbedding } from "@/lib/embedding";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);



export const revalidate = 0;

//Decide if search is needed or not
async function shouldSearch(query: string){
  try{
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:  `Answer ONLY "yes" or "no".
            Say "yes" if the query involves:
            - weather
            - news
            - current events
            - live data
            - prices
            - scores
            - location-based info
            Otherwise say "no".`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens:5,
      }),
    });
    const data = await res.json();
    const decision =  data.choices?.[0]?.message?.content?.toLowerCase() || "";
    return decision .includes("yes");
  }catch{
    return false;
  }
}

//Web search
async function searchWeb(query: string){
  try{
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.WEB_SEARCH_API!
      },
      body: JSON.stringify({q: query}),
    });

    const data = await res.json();
    return data.organic?.slice(0, 5).map((item: any)=>({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    })) || [];
  }catch{
    return []
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

//Main LLM 
export async function POST(req: Request){
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if(!session){
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = session.user.id;
        const body = await req.json();
        const userMessage = body.message;
        const chatId = body.chatId;
        let ragContext = "";

       try {
         const queryEmbedding = await hf.featureExtraction({
           model: "sentence-transformers/all-MiniLM-L6-v2",
           inputs: userMessage,
         });

         const queryVector = normalizeEmbedding(queryEmbedding)
           

         const allEmbeddings = await Embedding.find({ userId }).limit(200);

         const topChunks = allEmbeddings
           .map((e: any) => ({
             text: e.text,
             score: cosineSimilarity(queryVector, e.embedding),
           }))
           .sort((a, b) => b.score - a.score)
           .slice(0, 5);

         ragContext = topChunks.map((c) => c.text).join("\n");
       } catch (err) {
         console.log("RAG error", err);
       }


        let previousMessages: any[] = [];
        if(chatId){
         previousMessages = await Message.find({ threadId: chatId }).sort({ createdAt: -1}).limit(4)
        .lean();
        previousMessages = previousMessages.reverse();
        };
        const formattedHistory = previousMessages.map((msg)=>({
          role: msg.role,
          content: msg.content
        }));
        console.log("CHAT ID:", chatId);
        console.log("PREVIOUS MESSAGES:", previousMessages);

        const forceKeywords = ["latest","weather", "today", "now", "news", "price", "score"];
        const forceSearch = forceKeywords.some(word =>userMessage.toLowerCase().includes(word));
        
        const needSearch = forceSearch || await shouldSearch(userMessage);
        
        let context ="";

        if(needSearch){
          const results = await searchWeb(userMessage);
          
          context = results.map((body: any, num: number)=>`Source ${num+1}: Title: ${body.title}
          Summary: ${body.snippet} Link: ${body.link}`).join("\n\n");
        }

        const detailedKeywords = [
          "detail",
          "detailed",
          "full",
          "explain",
          "explanation",
          "in depth",
          "deep",
          "elaborate",
          "comprehensive",
          "step by step",
          "guide",
          "complete",
        ];

let isDetailed = detailedKeywords.some(word=>userMessage.toLowerCase().includes(word));

  const systemPrompt = `You are Echo, a smart AI assistant.

  IMPORTANT:
 - ALWAYS resolve pronouns like "it", "they", "that" using previous conversation
  - Use context when relevant
  - Do not ask for clarification if context exists

  ${isDetailed
    ? "Give a detailed structured answer"
    : "Give a concise answer"}`;

  if (userMessage.length > 150) isDetailed = true;

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions",
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
                content: systemPrompt
              },

             { role: "user",
              content: `Conversation so far:
              ${formattedHistory.map(m => `${m.role}: ${m.content}`).join("\n")}

              ${ragContext ? `Document Context:\n${ragContext}\n` : ""}

              Current question: ${userMessage}

              Instruction:
              - Resolve references like "it", "they", "that" using the conversation above
              - Use document context if relevant
              
              ${context ? `Web Results:\n${context}` : ""}
              ${isDetailed ? "Give a detailed answer." : "Give a short answer (6-10 lines)."}`}
            ],
            stream: true,
          }),
        },
      );
      console.log("Groq status:", groqResponse.status);
      
      if (!groqResponse.ok) {
        const errText = await groqResponse.text();
        console.error("Groq API Error:", errText);
        return new Response("LLM Error", { status: 500 });}

      const encoder = new TextEncoder();

      let fullResponse = "";
      
  return new Response(new ReadableStream({
    async start(controller){
      const reader = groqResponse.body?.getReader();
      const decoder = new TextDecoder();

      if(!reader) return;

      let buffer = "";
      let thread;
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
         if (chatId) {
          thread = await Thread.findOne({ _id: chatId, userId });
          if (!thread) {
            throw new Error("Thread not found or unauthorized");
          }
        } else {
          thread = await Thread.create({
            title: userMessage.slice(0, 30),
            userId,
          });
        }
        await Message.create([
          {
            threadId: thread._id,
            role: "user",
            content: userMessage,
          },
          {
            threadId: thread._id,
            role: "assistant",
            content: fullResponse,
          },
        ]);
      }catch(error){
        console.error("DB save Error:", error);
      }
      if(thread?._id){
      controller.enqueue(encoder.encode(`_CHAT_ID_:${thread._id}`));}
      controller.close();
    }
  }),
{
  headers: {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache"
  }
}); 
   console.log("USER ID:", userId);
   console.log("EMBEDDINGS COUNT:", await Embedding.countDocuments({ userId }));
    }catch(error){
      console.error("API error: " , error);
      return new Response("Error", {status: 500})
    }
  };