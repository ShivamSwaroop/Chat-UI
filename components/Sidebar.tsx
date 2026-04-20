"use client";
import { useState } from "react";
import { FaDeleteLeft } from "react-icons/fa6";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";

type Chat = {
    _id: string;
    title: string;
    messages: {
        content: string;
        role: "user" | "assistant";
    }
    timestamp: Date;
};
type Props = {
    chats: Chat[];
    onSelectChat: (chat: Chat)=> void;
    onNewChat: () => void;
    onDelete: (id: string) => void;
    onRename: (id: string) => void;
    editingId: string | null;
    setEditingId: (id: string | null)=> void;
    newTitle: string;
    setNewTitle: (val: string)=> void;


    isOpen: boolean;
}

export default function Sidebar ({ chats, onSelectChat, onNewChat, isOpen, onDelete, onRename, 
  editingId, setEditingId, newTitle, setNewTitle}: Props){

    const [search, setSearch] = useState("");


   if(!isOpen) return null;
    return (
      <div
        className={`fixed top-14 left-0 h-[calc(100%-3.5rem)] shrink-0 w-64 bg-[#202123] border-r border-gray-900 p-4 flex flex-col z-40 `}
      >
        <input
          placeholder="search threads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-3 bg-[#2a2b32] rounded-md text-sm outline-none"
        />
        <button
          onClick={onNewChat}
          className="mb-4 bg-blue-500 hover:bg-blue-600 transition text-white py-2 rounded text-sm"
        >
          + New chat
        </button>
        <h2 className="text-sm font-semibold mb-4 text-gray-300">Recents</h2>
        <div className="space-y-2">
          {chats
            .filter((thread) =>
              thread.title.toLowerCase().includes(search.toLowerCase()),
            )
            .map((chat) => (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className="group flex items-center justify-between text-xs text-gray-400 p-2 rounded hover:bg-[#2a2b32] cursor-pointer"
              >
                {editingId === chat._id ? (
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => onRename(chat._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onRename(chat._id);
                    }}
                    className="bg-[#2a2b32] text-xs p-1 rounded w-full outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(chat._id);
                      setNewTitle(chat.title);
                    }}
                    className="truncate"
                  >
                    {chat.title}{" "}
                  </span>
                )}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">

                  <button onClick={(e) => { e.stopPropagation();
                      setEditingId(chat._id);
                      setNewTitle(chat.title);
                    }}
                    className="text-gray-400 hover:text-white text-xs">
                    <MdOutlineDriveFileRenameOutline />
                  </button>

                  <button onClick={(e) => {
                      e.stopPropagation();
                      onDelete(chat._id);
                    }}
                    className="text-red-400 hover:text-red-600 text-xs">
                    <FaDeleteLeft />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    );

}