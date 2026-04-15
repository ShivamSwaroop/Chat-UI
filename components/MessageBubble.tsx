"use client";

import ReactMarkdown from "react-markdown";
import { TbUserFilled } from "react-icons/tb";
import { RiRobot2Fill } from "react-icons/ri";

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
};

type Props = { message: Message };

export default function MessageBubble({ message }: Props){

    const isUser = message.role === "user";

    return (
        <div className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser ? <RiRobot2Fill size={24} className="text-gray-500"/> : <TbUserFilled size={24} className="text-gray-500"/>}
            <div className={`max-w-[75%] w-fit overflow-hidden px-4 py-2 rounded-lg text-sm 
            ${isUser ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-700 text-gray-300 rounded-bl-none"}`}>
                <div className="overflow-x-auto prose prose-invert prose-sm max-w-none break-all whitespace-pre-wrap">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <span>{new Date(message.timestamp).toLocaleTimeString([],{hour: "2-digit", minute: "2-digit"})}
                </span>
            </div>
        </div>
    )
}   