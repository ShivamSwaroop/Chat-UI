"use client";

import { IoSend } from "react-icons/io5";
import { useState, useRef } from "react";
import { FaPaperclip } from "react-icons/fa";
import { FiPaperclip } from "react-icons/fi";

type Props = { onSend: (message: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>)=> void;
};


export default function InputArea({ onSend, onFileUpload }: Props) {
    const [input, setInput] = useState("");
    const fileRef = useRef<HTMLInputElement | null>(null);

    function handleSend () {
        if (!input.trim()) return;

        onSend(input);
        setInput("");
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>)=>{
        if(e.key === "Enter") {
            handleSend();
        }
    };
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 text-gray-400 hover:text-white"
        >
          <FaPaperclip size={18} />
        </button>
        <input
          type="file"
          ref={fileRef}
          onChange={onFileUpload}
          className="hidden"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Hey whats a chatbot?..."
          className="flex-1 bg-[#40414f] text-white px-4 py-2 rounded-lg outline-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-blue-500 px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          <IoSend size={18} />
        </button>
      </div>
    );
};