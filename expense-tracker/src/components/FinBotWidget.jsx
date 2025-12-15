// components/FinBotWidget.jsx

import React, { useState, useRef, useEffect } from "react";
import { 
    X, Send, Sparkles, PieChart as PieIcon, Users, Activity, 
    Shield, Clock, DollarSign, Settings, Zap, ChevronRight, CheckCircle, Bell
} from "lucide-react";
import { sendChatMessage } from "../services/chatService";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom"; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ==================================================================================
// 🎨 GLOBAL STYLES & CONFIG
// ==================================================================================
const chartColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const aiOrbStyleDark = {
    background: "conic-gradient(from 180deg at 50% 50%, #2563EB 0deg, #9333EA 180deg, #06B6D4 360deg)",
    filter: "blur(20px)",
};

const aiOrbStyleLight = {
    background: "conic-gradient(from 180deg at 50% 50%, #60A5FA 0deg, #3B82F6 180deg, #9333EA 360deg)",
    filter: "blur(15px)", 
};

// ==================================================================================
// 🔔 NEW: NOTIFICATION TOAST COMPONENT (Nâng cấp hiển thị thông báo)
// ==================================================================================
const NotificationToast = ({ message, isVisible, onClose, isDark }) => {
    if (!isVisible) return null;

    return (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[120] 
            animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-none
        `}>
            <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm ml-auto
                ${isDark 
                    ? "bg-[#064e3b]/90 border-green-500/30 text-green-100 shadow-green-900/20" 
                    : "bg-white/95 border-green-100 text-gray-800 shadow-lg"
                }
            `}>
                <div className={`p-2 rounded-full shrink-0 ${isDark ? "bg-green-500/20" : "bg-green-100"}`}>
                    <CheckCircle size={20} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h5 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isDark ? "text-green-400" : "text-green-600"}`}>
                        Thành công
                    </h5>
                    <p className="text-xs sm:text-sm font-medium truncate leading-tight">
                        {message}
                    </p>
                </div>
                <button onClick={onClose} className="p-1 hover:opacity-70 transition">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

// ==================================================================================
// 🧩 SUB-COMPONENTS (WIDGETS) - SAFE RENDER
// ==================================================================================

// 1. KPI WIDGET
const AdminKpiWidget = ({ data, isDark }) => {
    const safeData = {
        users: data?.users || 0,
        balance: data?.balance || 0,
        new_users: data?.new_users || 0,
        '2fa': data?.['2fa'] || 0
    };

    return (
        <div className={`mt-3 w-full p-3 rounded-2xl border backdrop-blur-sm transition-all duration-300
            ${isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white/80 border-blue-100 shadow-lg shadow-blue-500/5"
            }`}>
            <p className={`text-[10px] font-bold mb-3 uppercase tracking-widest flex items-center gap-2
                ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                <Activity size={12} /> System Vitality
            </p>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: "Users", val: safeData.users, icon: Users, color: isDark ? "text-blue-400" : "text-blue-600", bg: isDark ? "bg-blue-500/10" : "bg-blue-50" },
                    { label: "Balance", val: `$${(safeData.balance / 1000).toFixed(0)}k`, icon: DollarSign, color: isDark ? "text-emerald-400" : "text-emerald-600", bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50" },
                    { label: "New (24h)", val: `+${safeData.new_users}`, icon: Clock, color: isDark ? "text-purple-400" : "text-purple-600", bg: isDark ? "bg-purple-500/10" : "bg-purple-50" },
                    { label: "2FA Active", val: safeData['2fa'], icon: Shield, color: isDark ? "text-orange-400" : "text-orange-600", bg: isDark ? "bg-orange-500/10" : "bg-orange-50" }
                ].map((item, i) => (
                    <div key={i} className={`${item.bg} border ${isDark ? "border-white/5" : "border-transparent"} p-2 rounded-xl flex flex-col items-center justify-center`}>
                        <item.icon size={16} className={`${item.color} mb-1`} />
                        <span className={`text-[9px] uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.label}</span>
                        <span className={`text-base font-bold ${isDark ? "text-gray-100" : "text-gray-800"}`}>{item.val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2. USER CARD
const AdminUserCard = ({ data, onManage, isDark }) => {
    if (!data) return null;
    return (
        <div className={`mt-3 w-full p-[1px] rounded-2xl relative overflow-hidden group shadow-md transition-all duration-300
            ${isDark 
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-transparent" 
                : "bg-white border border-gray-100"}`}>
            
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-opacity
                ${isDark ? "opacity-20 group-hover:opacity-40" : "opacity-5 group-hover:opacity-10"}`}></div>
            
            <div className={`relative rounded-2xl p-4 h-full ${isDark ? "bg-[#0f1218]" : "bg-white/90 backdrop-blur-xl"}`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                        <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-lg
                            ${isDark ? "bg-gray-900 text-white" : "bg-white text-blue-600"}`}>
                            {data.name ? data.name.charAt(0).toUpperCase() : "U"}
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <h4 className={`font-bold text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>{data.name || "Unknown"}</h4>
                        <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{data.email || "No Email"}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                                ${isDark ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-50 text-green-600 border-green-200"}`}>Active</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                                ${isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-50 text-blue-600 border-blue-200"}`}>{data.role || "User"}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => onManage(data.email)}
                    className={`w-full py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 group border
                        ${isDark 
                            ? "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10" 
                            : "bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border-gray-200"}`}
                >
                    <Settings size={14} /> System Manage <ChevronRight size={14} className="opacity-50 group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
        </div>
    );
};

// 3. LOGS LIST
const AdminLogsList = ({ logs, isDark }) => {
    if (!Array.isArray(logs) || logs.length === 0) return null;
    return (
        <div className={`mt-3 w-full p-3 rounded-xl border font-mono text-[10px] shadow-lg backdrop-blur-md
            ${isDark 
                ? "bg-black/40 border-green-500/20 text-gray-300" 
                : "bg-gray-900 text-gray-300 border-gray-700" 
            }`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <span className="text-green-400 font-bold flex items-center gap-2"><Zap size={10}/> SYSTEM_STREAM</span>
                <div className="flex gap-1.5">
                    {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===1?'bg-red-500':i===2?'bg-yellow-500':'bg-green-500'} animate-pulse`}></div>)}
                </div>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-gray-500 shrink-0">[{log.time}]</span>
                        <span className={log.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}>{log.status === 'SUCCESS' ? '✔' : '✖'}</span>
                        <span className="truncate opacity-80">{log.action}: {log.details}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================================================================================
// 🧠 MAIN WIDGET
// ==================================================================================

export default function FinBotWidget({ theme }) { 
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "👋 Chào bạn! Tôi là FinBot AI. Tôi có thể giúp gì cho tài chính của bạn hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State cho Notification
  const [notification, setNotification] = useState({ show: false, message: "" });
  const timerRef = useRef(null); // Để quản lý thời gian tắt thông báo

  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); 
  
  const isDark = theme === "dark";

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, isOpen]);

  // --- HÀM KÍCH HOẠT THÔNG BÁO ---
  const triggerNotification = (msg) => {
    // Xóa timer cũ nếu có (để reset thời gian)
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setNotification({ show: true, message: msg });
    
    // Tự động tắt sau 4 giây
    timerRef.current = setTimeout(() => {
        setNotification({ show: false, message: "" });
    }, 4000);
  };

  // --- LOGIC XỬ LÝ TIN NHẮN ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userMsg.content);
      let botReply = res.reply;
      let specialData = { type: null, payload: null };

      // 🔥 NÂNG CẤP: Handle Reload Command & Notification
      if (botReply && botReply.includes("[REFRESH]")) {
          // Lấy nội dung thông báo (bỏ tag [REFRESH])
          const cleanMsg = botReply.replace("[REFRESH]", "").trim();
          
          // 1. Kích hoạt Reload dữ liệu nền
          window.dispatchEvent(new Event("transactionUpdated"));
          
          // 2. Kích hoạt Toast Notification (Giao diện xịn)
          triggerNotification(cleanMsg);

          // Xóa tag khỏi tin nhắn hiển thị trong chat
          botReply = cleanMsg;
      }

      // Regex Parsers
      const patterns = [
        { type: 'chart', regex: /\[CHART_DATA_START\]([\s\S]*?)\[CHART_DATA_END\]/ },
        { type: 'admin_kpi', regex: /\[ADMIN_KPI_DATA\]([\s\S]*?)\[\/ADMIN_KPI_DATA\]/ },
        { type: 'admin_logs', regex: /\[ADMIN_LOGS_DATA\]([\s\S]*?)\[\/ADMIN_LOGS_DATA\]/ },
        { type: 'admin_user', regex: /\[ADMIN_USER_DATA\]([\s\S]*?)\[\/ADMIN_USER_DATA\]/ },
      ];

      for (const p of patterns) {
        const match = botReply.match(p.regex);
        if (match) {
            try {
                specialData = { type: p.type, payload: JSON.parse(match[1]) };
                botReply = botReply.replace(match[0], "").trim();
                break; 
            } catch (e) {
                console.warn("Parse error for widget:", p.type);
            }
        }
      }

      const botMsg = { role: "bot", content: botReply, special: specialData };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.warn("FinBot Error (Silent):", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageUser = (email) => { setIsOpen(false); navigate("/admin/users"); };
  const handleKeyPress = (e) => { if (e.key === "Enter") handleSend(); };

  // ==================================================================================
  // 🖥️ UI RENDER
  // ==================================================================================
  return (
    <>
    <style>{`
        @keyframes orb-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 0.5; }
            100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
        }
    `}</style>

    {/* 🔔 RENDER NOTIFICATION TOAST (Global level) */}
    <NotificationToast 
        message={notification.message} 
        isVisible={notification.show} 
        onClose={() => setNotification({ ...notification, show: false })}
        isDark={isDark}
    />

    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end pointer-events-none font-sans w-full sm:w-auto">
      
      {/* 🚀 CHAT WINDOW (Mobile Optimized) */}
      {isOpen && (
        <div className={`pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 transition-all
            w-full h-[100dvh] sm:w-[400px] sm:h-[650px] sm:rounded-[32px] rounded-none
            ${isDark 
                ? "bg-[#0B1120]/95 border-none sm:border border-white/10 shadow-[0_0_50px_-10px_rgba(37,99,235,0.4)] backdrop-blur-2xl" 
                : "bg-white/95 border-none sm:border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl" 
            }`}>
          
          {/* --- HEADER --- */}
          <div className={`relative h-20 sm:h-44 flex flex-col items-center justify-center shrink-0 transition-colors duration-500
                ${isDark ? "bg-gradient-to-b from-blue-900/20 to-transparent" : "bg-gradient-to-b from-blue-50 to-transparent"}
          `}>
             {/* Close Button */}
             <button onClick={() => setIsOpen(false)} className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-20
                ${isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}>
                <X size={24} />
            </button>
            
            {/* Header Content (Simplified on Mobile) */}
            <div className="flex sm:flex-col items-center gap-3 sm:gap-0 mt-4 sm:mt-0">
                <div className="relative w-10 h-10 sm:w-24 sm:h-24 flex items-center justify-center">
                    {isLoading ? (
                        <>
                            <div className="absolute inset-0 rounded-full" 
                                style={{...(isDark ? aiOrbStyleDark : aiOrbStyleLight), animation: 'orb-pulse 1.5s infinite ease-in-out'}}></div>
                            <div className={`absolute inset-1 rounded-full z-10 flex items-center justify-center backdrop-blur-sm
                                ${isDark ? "bg-black/60" : "bg-white/60"}`}>
                                <Sparkles size={20} className={`animate-spin-slow ${isDark ? "text-white" : "text-blue-600"}`} />
                            </div>
                        </>
                    ) : (
                        <div className="relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-lg" 
                             style={{
                                 animation: 'float 3s ease-in-out infinite',
                                 background: isDark ? "linear-gradient(135deg, #3B82F6, #9333EA)" : "linear-gradient(135deg, #FFFFFF, #EFF6FF)"
                             }}>
                            <Sparkles size={24} className={`sm:w-8 sm:h-8 ${isDark ? "text-white" : "text-blue-500"}`} />
                        </div>
                    )}
                </div>
                
                <div className="text-left sm:text-center z-10">
                    <h3 className={`font-bold text-lg tracking-tight ${isDark ? "text-white" : "text-gray-800"}`}>FinBot AI</h3>
                    <p className={`hidden sm:flex text-xs items-center justify-center gap-1.5 mt-1 ${isDark ? "text-blue-300/60" : "text-gray-500"}`}>
                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
                        {isLoading ? "Processing..." : "Online"}
                    </p>
                </div>
            </div>
          </div>

          {/* --- CHAT BODY --- */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar transition-colors duration-300 
                ${isDark ? "bg-gradient-to-b from-transparent to-black/20" : "bg-[#F8FAFC]" }
          `}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Message Bubble */}
                {msg.content && (
                  <div 
                    className={`max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-md shadow-sm border
                    ${msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-blue-500/20" 
                        : isDark
                            ? "bg-white/5 text-gray-200 rounded-tl-none border-white/10 shadow-lg"
                            : "bg-white text-gray-700 rounded-tl-none border-gray-100 shadow-sm"
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {/* --- WIDGETS --- */}
                
                {/* Chart Widget */}
                {msg.special?.type === 'chart' && msg.special.payload?.data && (
                  <div className={`mt-2 w-full max-w-[95%] p-4 rounded-2xl border shadow-xl transition-colors
                        ${isDark ? "bg-[#111827] border-white/10" : "bg-white border-gray-100 shadow-gray-200"}
                  `}>
                    <p className={`text-xs font-bold mb-4 text-center uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {msg.special.payload.title}
                    </p>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={msg.special.payload.data} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                            {msg.special.payload.data.map((e, i) => <Cell key={i} fill={chartColors[i % 5]} />)}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                                background: isDark ? '#1F2937' : '#FFFFFF', 
                                borderColor: isDark ? '#374151' : '#E5E7EB', 
                                color: isDark ? '#F3F4F6' : '#111827', 
                                borderRadius: '8px', 
                                fontSize: '12px',
                            }} 
                            formatter={(val) => new Intl.NumberFormat('en-US').format(val)} 
                          />
                          <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px', opacity: 0.7, paddingTop: '10px'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <button onClick={() => {setIsOpen(false); navigate("/analytics")}} className={`w-full mt-3 py-2 text-xs font-bold rounded-lg border transition flex items-center justify-center gap-2
                        ${isDark 
                            ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20" 
                            : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100"}
                    `}>
                        <PieIcon size={12} /> Full Report
                    </button>
                  </div>
                )}

                {/* Admin Widgets */}
                {msg.special?.type === 'admin_kpi' && <AdminKpiWidget data={msg.special.payload} isDark={isDark} />}
                {msg.special?.type === 'admin_user' && <AdminUserCard data={msg.special.payload} onManage={handleManageUser} isDark={isDark} />}
                {msg.special?.type === 'admin_logs' && <AdminLogsList logs={msg.special.payload} isDark={isDark} />}
                
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
                <div className={`flex gap-1.5 items-center ml-2 p-3 w-fit rounded-2xl ${isDark ? "bg-white/5" : "bg-white shadow-sm border border-gray-100"}`}>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-150"></div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* --- INPUT AREA --- */}
          <div className={`p-3 sm:p-4 border-t backdrop-blur-xl transition-colors duration-300
                ${isDark ? "bg-black/40 border-white/5" : "bg-white/80 border-gray-100"}
          `}>
            <div className={`relative flex items-center rounded-full border transition-all shadow-inner
                ${isDark 
                    ? "bg-[#1a1f2e] border-white/10 focus-within:border-blue-500/50 focus-within:ring-blue-500/20" 
                    : "bg-gray-100 border-transparent focus-within:bg-white focus-within:border-blue-200 focus-within:ring-blue-100"}
                focus-within:ring-2 sm:focus-within:ring-4
            `}>
              <input 
                type="text" 
                value={input} 
                onChange={(e)=>setInput(e.target.value)} 
                onKeyDown={handleKeyPress} 
                className={`flex-1 bg-transparent px-4 sm:px-5 py-3 sm:py-3.5 text-sm focus:outline-none 
                    ${isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-800 placeholder:text-gray-400"}
                `}
                placeholder="Ask me anything..." 
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim()} 
                className="absolute right-1.5 p-2 sm:p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 TOGGLE BUTTON */}
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)} 
            className="pointer-events-auto group relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-4 mr-4 sm:mb-0 sm:mr-0"
          >
            <div className={`absolute inset-0 rounded-full blur-xl animate-pulse transition-opacity
                ${isDark 
                    ? "bg-blue-500 opacity-40 group-hover:opacity-60" 
                    : "bg-blue-400 opacity-30 group-hover:opacity-50"}`}></div>
            
            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-110 transition-transform duration-300
                ${isDark 
                    ? "bg-gradient-to-br from-[#1a1f2e] to-black border-white/10" 
                    : "bg-white border-white/50"}`}>
                
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <Sparkles size={24} className={`${isDark ? "text-blue-400 group-hover:text-white" : "text-blue-600 group-hover:text-blue-700"} relative z-10 transition-transform group-hover:rotate-12`} />
            </div>
          </button>
      )}

    </div>
    </>
  );
}