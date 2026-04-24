"use client";

import { useRef, useState, useEffect} from "react";
import MessageBubble from "@/components/MessageBubble";
import Sidebar from "@/components/Sidebar";
import InputArea from "@/components/InputArea";
import { GiEchoRipples } from "react-icons/gi";
import { GiHamburgerMenu } from "react-icons/gi";
import { useSession } from "next-auth/react";
import { signOut, signIn } from "next-auth/react";

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  }

export default function ChatWindow() {
    const messageEndRef = useRef<HTMLDivElement|null>(null);
    const currentThreadRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [threads, setThreads] = useState<any[]>([]);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState("");


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
                body: JSON.stringify({ message: text, chatId: currentThreadRef.current })
            });

            if(!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let botMessage = "";
            let buffer = "";

            setMessages((prevMessages) => [...prevMessages, {
              id: (Date.now() +1).toString(),
              content: "",
              role: "assistant",
              timestamp: new Date()
            }]);

           while (true) {
             const { done, value } = await reader.read();
             if (done) break;

             const chunk = decoder.decode(value, { stream: true });
             buffer += chunk;

             if (buffer.includes("_CHAT_ID_:")) {
               const parts = buffer.split("_CHAT_ID_:");
               const textPart = parts[0];
               const idPart = parts[1];

               if (idPart) {
                 const cleanId = idPart.trim();

                 if (!currentThreadRef.current) {
                   currentThreadRef.current = cleanId;
                   setCurrentThreadId(cleanId);
                   fetchChats();
                 }
               }

               buffer = textPart;
             }

             await new Promise((res) => setTimeout(res, 130));

             if (buffer) {
               botMessage += buffer;

               setMessages((prevMessages) => {
                 const updated = [...prevMessages];
                 const lastIndex = updated.length - 1;

                 if (lastIndex >= 0) {
                   updated[lastIndex] = {
                     ...updated[lastIndex],
                     content: botMessage,
                   };
                 }

                 return updated;
               });

               buffer = "";
             }
           }
             setIsLoading(false);
             console.log("Sending with Thread:", currentThreadRef.current);

        } catch (error){

            setMessages((prevMessages) => [...prevMessages, 
                { id: Date.now().toString(), content: "Failed to get response. Please try again.", 
                    role: "assistant", timestamp: new Date()}
            ])
        }
      }

       async function fetchChats() {
            try {
              const res = await fetch("/api/threads");

              if (!res.ok) {
                console.error("Failed to fetch chats");
                return;
              }

              const data = await res.json();
              setThreads(data);
            } catch (err) {
              console.error("Fetch error:", err);
            }
          }

       const { data: session, status } = useSession();

         useEffect(() => {
          if(status === "authenticated"){
          fetchChats();
          }
      }, [status]);

        async function handleSelectChat(thread: any) {
          setCurrentThreadId(thread._id);
          currentThreadRef.current=thread._id;

          const res = await fetch(`/api/messages/${thread._id}`);
          const data = await res.json();

          setMessages(
            data.map((msg: any, i: number) => ({
              id: i.toString(),
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt || Date.now())
            })),
          );
          console.log("Selected Thread:", thread._id);
        }
        const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500"];
        const color = colors[(session?.user?.name?.length || 0) % colors.length];

        async function handleDelete(id: string) {
          await fetch(`/api/threads/${id}`, {
            method: "DELETE",
            credentials: "include"
          });

          fetchChats();

          if (currentThreadId === id) {
            setMessages([]);
            setCurrentThreadId(null);
            currentThreadRef.current = null;
          }
        };

        async function handleRename(id: string) {
          if (!newTitle.trim()) return;

          await fetch(`/api/threads/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ title: newTitle }),
          });

          setEditingId(null);
          fetchChats();
        };

        async function handleFileUpload(
          e: React.ChangeEvent<HTMLInputElement>,
        ) {
          const file = e.target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.append("file", file);

          await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
        }
    

    return (
      <div className="min-h-screen flex flex-col bg-[#343541] text-white">
        {status === "loading" ? (
          <div className="flex items-center justify-center h-screen">
            Loading...
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-50 h-14 border-b border-gray-700 flex items-center justify-between px-4 text-sm font-bold bg-[#202123]">
              <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  <GiHamburgerMenu />
                </button>
                <GiEchoRipples size={40} />
                Echo
              </div>
              <div>
                {session ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full ${color} flex items-center justify-center overflow-hidden`}
                        >
                          {session.user?.image ? (
                            <img
                              src={session.user.image}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-white">
                              {session.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-300">
                          {session.user?.name}
                        </span>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="bg-black px-3 py-1 rounded text-sm "
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => signIn()}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition p-2.5 rounded-md font-medium"
                  >
                    Login{" "}
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-1 min-h-0">
              <Sidebar
                chats={threads}
                isOpen={isSidebarOpen}
                onDelete={handleDelete}
                onSelectChat={handleSelectChat}
                onRename={handleRename}
                editingId={editingId}
                setEditingId={setEditingId}
                newTitle={newTitle}
                setNewTitle={setNewTitle}
                onNewChat={() => {
                  setCurrentThreadId(null);
                  currentThreadRef.current = null;
                  setMessages([]);
                }}
              />

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto px-4 py-6 space-y-4 bg-[#343541]">
                  <div className="max-w-3xl w-full mx-auto space-y-4 overflow-hidden">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-4">
                        <h1 className="text-4xl font-semibold text-black">
                          Hi, I'm ECHO
                        </h1>
                        <p className="text-md italic max-w-md mt-4 text-gray-400 leading-relaxed">
                          I turn your questions into conversations. What would
                          you like to explore?
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))
                    )}
                    {isLoading && (
                      <div className="text-gray-400 animate-pulse text-sm">
                        Thinking...
                      </div>
                    )}
                    <div ref={messageEndRef} />
                    {!session && (
                      <div className="text-xs text-gray-400 text-center">
                        Login to save your chats
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-700 p-4">
                  <div className="max-w-3xl mx-auto">
                    <InputArea onSend={handleSend} 
                    onFileUpload={handleFileUpload}/>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
}