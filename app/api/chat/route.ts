import { connectDB } from "@/lib/mongoose";
import Chat from "@/models/chat";

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

//Main LLM 
export async function POST(req: Request){
    try {
        await connectDB();
        const body = await req.json();
        const userMessage = body.message;
        const chatId = body.chatId;

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

const systemPrompt = isDetailed ? `You are Echo, a smart AI assistant.
  Give a detailed, structured, and comprehensive answer.
  - Use headings and bullet points
  - Explain concepts clearly
  - Provide examples if helpful
  - Be thorough but readable
  -answer in 40-50 lines maximum`
  : `You are Echo, a smart AI assistant.
  Give a concise and meaningful answer in 6–10 lines maximum.
  - Avoid long explanations
  - Focus on clarity and usefulness
  - No unnecessary details`; 

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
              { role: "user", content: context ? `Question: ${userMessage} 
              ${isDetailed ? "Give a detailed answer." : "Give a short answer (6-10 lines)."}
              Web Results: ${context}
              Answer using this results`: `${userMessage} 
              ${isDetailed ? "Give a detailed answer." : "Give a short answer (6-10 lines)."}` },
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
      controller.enqueue(encoder.encode(`_CHAT_ID_:${chat?._id}`));
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
    }catch(error){
      console.error("API error: " , error);
      return new Response("Error", {status: 500})
    }
  };