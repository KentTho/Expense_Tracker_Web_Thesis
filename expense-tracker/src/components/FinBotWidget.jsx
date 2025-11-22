import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, PieChart as PieIcon } from "lucide-react";
import { sendChatMessage } from "../services/chatService";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom"; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Màu sắc cho biểu đồ
const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function FinBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  // Tin nhắn chào mừng mặc định
  const [messages, setMessages] = useState([
    { role: "bot", content: "👋 Chào bạn! Tôi là FinBot. Tôi có thể giúp gì cho ví tiền của bạn hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); 

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Hiển thị tin nhắn người dùng ngay lập tức
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Gọi API
      const res = await sendChatMessage(userMsg.content);
      let botReply = res.reply;
      let chartData = null;

      // --- XỬ LÝ LOGIC ĐẶC BIỆT ---

      // A. Kiểm tra tín hiệu [REFRESH] để cập nhật dữ liệu trang web
      if (botReply.includes("[REFRESH]")) {
          console.log("♻️ FinBot: Detected refresh signal.");
          botReply = botReply.replace("[REFRESH]", "").trim();
          // Phát sự kiện toàn cục
          window.dispatchEvent(new Event("transactionUpdated"));
      }

      // B. Kiểm tra tín hiệu [CHART_DATA_START] để vẽ biểu đồ
      // Sử dụng Regex non-greedy ([\s\S]*?) để lấy nội dung giữa 2 thẻ
      const chartMatch = botReply.match(/\[CHART_DATA_START\]([\s\S]*?)\[CHART_DATA_END\]/);
      
      if (chartMatch) {
          try {
              const jsonString = chartMatch[1]; // Lấy chuỗi JSON ở giữa
              chartData = JSON.parse(jsonString); // Parse thành Object
              
              // Xóa toàn bộ cụm thẻ khỏi nội dung text hiển thị
              botReply = botReply.replace(chartMatch[0], "").trim();
          } catch (e) {
              console.error("❌ FinBot: Lỗi parse chart data", e);
          }
      }

      // 3. Hiển thị phản hồi của Bot (Text + Chart nếu có)
      const botMsg = { role: "bot", content: botReply, chart: chartData };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Xin lỗi, tôi đang bị quá tải hoặc mất kết nối. Thử lại sau nhé!" }]);
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
        <div className="pointer-events-auto w-[380px] h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
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
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Bong bóng chat văn bản */}
                {msg.content && (
                    <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600"
                    }`}
                    >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                )}

                {/* ✅ RENDER BIỂU ĐỒ (Nếu có dữ liệu chart) */}
                {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                    <div className="mt-2 w-full max-w-[90%] bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-md animate-in fade-in zoom-in duration-300">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase">
                            {msg.chart.title || "Thống kê chi tiêu"}
                        </p>
                        
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={msg.chart.data}
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {msg.chart.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val) => new Intl.NumberFormat('en-US').format(val)}
                                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Nút chuyển hướng sang trang Analytics */}
                        <button 
                            onClick={() => { setIsOpen(false); navigate("/analytics"); }}
                            className="w-full mt-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center justify-center gap-1"
                        >
                            <PieIcon size={12} /> Xem chi tiết tại Analytics
                        </button>
                    </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">FinBot đang suy nghĩ...</span>
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
              placeholder="Nhập... (vd: 'Vẽ biểu đồ tháng này')"
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button (Nút mở chat) */}
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