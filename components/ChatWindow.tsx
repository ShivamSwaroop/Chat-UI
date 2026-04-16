"use client";

import { useRef, useState, useEffect} from "react";
import MessageBubble from "@/components/MessageBubble";
import Sidebar from "@/components/Sidebar";
import InputArea from "@/components/InputArea";
import { GiEchoRipples } from "react-icons/gi";
import { GiHamburgerMenu } from "react-icons/gi";

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
    }

export default function ChatWindow() {
    const messageEndRef = useRef<HTMLDivElement|null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [chats, setChats] = useState<any[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);


    function scrollToBottom(){
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    },[messages]);

     async function handleSend (text: string) {
        const userMessage: Message =  {
            id: Date.now().toString(),
            content: text,
            role: "user",
            timestamp: new Date()

        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setIsLoading(true);

        try{
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: text, chatId: currentChatId })
            });

            if(!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let botMessage = "";

            setMessages((prevMessages) => [...prevMessages, {
              id: (Date.now() +1).toString(),
              content: "",
              role: "assistant",
              timestamp: new Date()
            }]);

            while (true){
              const {done, value} = await reader.read();
              if(done) break;
              const chunk = decoder.decode(value, {stream: true});

              if(chunk.includes("_CHAT_ID_")){
                const id = chunk.split("_CHAT_ID_:")[1];

                if(id && !currentChatId){
                  setCurrentChatId(id.trim());
                }
                continue;
              }
              botMessage += chunk;

              await new Promise((res) => setTimeout(res, 130));

              setMessages((prevMessage) => { 
                const updated = [...prevMessage];
                const lastIndex = updated.length - 1;

                if(lastIndex >= 0) {
                  updated[lastIndex]= {...updated[lastIndex], content: botMessage}
                }
                return updated;
              })
            }
             setIsLoading(false);
             await fetchChats();

        }catch (error){

            setMessages((prevMessages) => [...prevMessages, 
                { id: Date.now().toString(), content: "Failed to get response. Please try again.", 
                    role: "assistant", timestamp: new Date()}
            ])
        }
      }

       async function fetchChats() {
            try {
              const res = await fetch("/api/chats");

              if (!res.ok) {
                console.error("Failed to fetch chats");
                return;
              }

              const data = await res.json();
              setChats(data);
            } catch (err) {
              console.error("Fetch error:", err);
            }
          }

      useEffect(() => {
          fetchChats();
        }, []);

        function handleSelectChat(chat: any) {
          setCurrentChatId(chat._id);

          setMessages(
            chat.messages.map((msg: any, i: number) => ({
              id: i.toString(),
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt || Date.now())
            })),
          );
        }
    

    return (
      <div className="min-h-screen flex flex-col bg-[#343541] text-white">
        <div className="sticky top-0 z-50 h-14 border-b border-gray-700 flex items-center px-4 text-sm font-bold bg-[#202123]">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><GiHamburgerMenu /></button>
          <GiEchoRipples size={40}/>Echo
        </div>
        <div className="flex flex-1 min-h-0">

           <Sidebar chats={chats} isOpen={isSidebarOpen} onSelectChat={handleSelectChat} 
          onNewChat={()=>{setCurrentChatId(null); 
          setMessages([]);}} />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto px-4 py-6 space-y-4 bg-[#343541]">
          <div className="max-w-3xl w-full mx-auto space-y-4 overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-4">
                <h1 className="text-4xl font-semibold text-black">Hi, I'm {" "}
                  <span className="text-3xl font-semibold mb-3 bg-clip-text text-transparent">Echo</span></h1>
                <p className="text-md max-w-md mt-4 text-gray-400 leading-relaxed">
                  I turn your questions into conversations. What would you like to explore?</p>
              </div>
             ):(messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            )))}
            {isLoading && (
              <div className="text-gray-400 animate-pulse text-sm">Thinking...</div>
            )}
            <div ref={messageEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <InputArea onSend={handleSend} />
          </div>
        </div>
        </div>
        </div>
      </div>
    );
}