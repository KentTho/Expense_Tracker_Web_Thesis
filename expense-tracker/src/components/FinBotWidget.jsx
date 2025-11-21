import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot } from "lucide-react";
import { sendChatMessage } from "../services/chatService";
import ReactMarkdown from "react-markdown"; // Cần cài: npm install react-markdown

export default function FinBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "👋 Chào bạn! Tôi là FinBot. Tôi có thể giúp gì cho ví tiền của bạn hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userMsg.content);
      const botMsg = { role: "bot", content: res.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Xin lỗi, tôi đang bị quá tải. Thử lại sau nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-[350px] h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">FinBot AI</h3>
                <p className="text-xs text-blue-100">Financial Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {msg.role === "bot" ? (
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-xs text-gray-500">FinBot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập chi tiêu (vd: Ăn sáng 50k)..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
            isOpen ? "bg-gray-500 rotate-90" : "bg-gradient-to-r from-blue-600 to-purple-600 animate-bounce-slow"
        }`}
      >
        {isOpen ? <X className="text-white" size={28} /> : <Bot className="text-white" size={28} />}
      </button>
    </div>
  );
}