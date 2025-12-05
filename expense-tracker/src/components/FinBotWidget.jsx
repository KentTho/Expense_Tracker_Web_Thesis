// components/FinBotWidget.jsx (Cập nhật phần render Chart)
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, PieChart as PieIcon } from "lucide-react";
import { sendChatMessage } from "../services/chatService";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom"; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"; // ✅ Thêm Legend

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function FinBotWidget() {
  // ... (Phần state và logic handleSend giữ nguyên) ...
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", content: "👋 Chào bạn! Tôi là FinBot." }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); 

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userMsg.content);
      let botReply = res.reply;
      let chartData = null;

      if (botReply.includes("[REFRESH]")) {
          botReply = botReply.replace("[REFRESH]", "").trim();
          window.dispatchEvent(new Event("transactionUpdated"));
      }

      const chartMatch = botReply.match(/\[CHART_DATA_START\]([\s\S]*?)\[CHART_DATA_END\]/);
      if (chartMatch) {
          try {
              chartData = JSON.parse(chartMatch[1]);
              botReply = botReply.replace(chartMatch[0], "").trim();
          } catch (e) { console.error(e); }
      }

      const botMsg = { role: "bot", content: botReply, chart: chartData };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Lỗi kết nối." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => { if (e.key === "Enter") handleSend(); };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto w-[380px] h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2"><Bot size={20} /><span className="font-bold text-sm">FinBot AI</span></div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded"><X size={18} /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {/* Text */}
                {msg.content && (
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600"}`}>
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                )}

                {/* Chart */}
                {msg.chart && msg.chart.data && (
                    <div className="mt-2 w-full max-w-[95%] bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-md">
                        <p className="text-xs font-bold text-gray-500 mb-2 text-center uppercase">{msg.chart.title}</p>
                        <div className="h-48 w-full"> {/* Tăng chiều cao */}
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={msg.chart.data}
                                        innerRadius={30}
                                        outerRadius={55}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name" // ✅ FIX: Thêm dòng này để hiện tên
                                    >
                                        {msg.chart.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    {/* ✅ FIX: Tooltip hiển thị tên và giá trị */}
                                    <Tooltip formatter={(val, name) => [new Intl.NumberFormat('en-US').format(val), name]} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <button 
                            onClick={() => { setIsOpen(false); navigate("/analytics"); }}
                            className="w-full mt-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-1"
                        >
                            <PieIcon size={12} /> View Full Analytics
                        </button>
                    </div>
                )}
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><Loader2 className="animate-spin text-blue-500" /></div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
           <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
             <input type="text" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleSend()} className="flex-1 p-2 rounded bg-gray-100 dark:bg-gray-700 outline-none text-sm" placeholder="Nhập..." />
             <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-full"><Send size={18} /></button>
           </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="pointer-events-auto p-4 rounded-full bg-blue-600 text-white shadow-2xl"><Bot size={28} /></button>
    </div>
  );
}