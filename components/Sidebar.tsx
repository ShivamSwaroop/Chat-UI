"use client";

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
    isOpen: boolean;
}

export default function Sidebar ({ chats, onSelectChat, onNewChat, isOpen}: Props){
   if(!isOpen) return null;
    return(
       <div className={`fixed top-14 left-0 h-[calc(100%-3.5rem)] shrink-0 w-64 bg-[#202123] border-r border-gray-900 p-4 flex flex-col z-40 `}>
            <button onClick={onNewChat} className="mb-4 bg-blue-500 hover:bg-blue-600 transition text-white py-2 rounded text-sm">
                + New chat</button>
            <h2 className="text-sm font-semibold mb-4 text-gray-300">Recents</h2>
            <div className="space-y-2">
                {chats.map((chat) => (
                    <div key={chat._id} className="text-xs text-gray-400 truncate cursor-pointer hover:text-white" 
                    onClick={() => onSelectChat(chat)}>
                        {chat.title}
                    </div>
                ))}
            </div>
        </div>
    )

}