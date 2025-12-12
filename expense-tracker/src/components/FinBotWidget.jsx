import React, { useState, useRef, useEffect } from "react";
import { 
    X, Send, Sparkles, PieChart as PieIcon, Users, Activity, 
    Shield, Clock, DollarSign, Settings, Zap, ChevronRight
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
    filter: "blur(15px)", // Giảm blur để rõ hơn trên nền sáng
};

// ==================================================================================
// 🧩 SUB-COMPONENTS (WIDGETS) - AUTO THEME ADAPTATION
// ==================================================================================

// 1. KPI WIDGET
const AdminKpiWidget = ({ data, isDark }) => (
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
                { label: "Users", val: data.users, icon: Users, color: isDark ? "text-blue-400" : "text-blue-600", bg: isDark ? "bg-blue-500/10" : "bg-blue-50" },
                { label: "Balance", val: `$${(data.balance / 1000).toFixed(0)}k`, icon: DollarSign, color: isDark ? "text-emerald-400" : "text-emerald-600", bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50" },
                { label: "New (24h)", val: `+${data.new_users}`, icon: Clock, color: isDark ? "text-purple-400" : "text-purple-600", bg: isDark ? "bg-purple-500/10" : "bg-purple-50" },
                { label: "2FA Active", val: data['2fa'], icon: Shield, color: isDark ? "text-orange-400" : "text-orange-600", bg: isDark ? "bg-orange-500/10" : "bg-orange-50" }
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

// 2. USER CARD
const AdminUserCard = ({ data, onManage, isDark }) => (
    <div className={`mt-3 w-full p-[1px] rounded-2xl relative overflow-hidden group shadow-md transition-all duration-300
        ${isDark 
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-transparent" 
            : "bg-white border border-gray-100"}`}>
        
        {/* Gradient Background Effect */}
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
                    <h4 className={`font-bold text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>{data.name}</h4>
                    <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{data.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                            ${isDark ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-50 text-green-600 border-green-200"}`}>Active</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                            ${isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-50 text-blue-600 border-blue-200"}`}>{data.role}</span>
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

// 3. LOGS LIST
const AdminLogsList = ({ logs, isDark }) => (
    <div className={`mt-3 w-full p-3 rounded-xl border font-mono text-[10px] shadow-lg backdrop-blur-md
        ${isDark 
            ? "bg-black/40 border-green-500/20 text-gray-300" 
            : "bg-gray-900 text-gray-300 border-gray-700" // Logs luôn để nền tối cho giống Terminal
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

// ==================================================================================
// 🧠 MAIN WIDGET
// ==================================================================================

export default function FinBotWidget({ theme }) { // 👈 NHẬN THEME TỪ PROPS (QUAN TRỌNG)
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "👋 Chào bạn! Tôi là FinBot AI. Tôi có thể giúp gì cho tài chính của bạn hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); 
  
  // Xác định chế độ Dark
  const isDark = theme === "dark";

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, isOpen]);

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

      if (botReply.includes("[REFRESH]")) {
          botReply = botReply.replace("[REFRESH]", "").trim();
          window.dispatchEvent(new Event("transactionUpdated"));
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
            } catch (e) {}
        }
      }

      const botMsg = { role: "bot", content: botReply, special: specialData };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Mất kết nối với máy chủ AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageUser = (email) => { setIsOpen(false); navigate("/admin/users"); };
  const handleKeyPress = (e) => { if (e.key === "Enter") handleSend(); };

  // ==================================================================================
  // 🖥️ UI RENDER (CHẾ ĐỘ SÁNG / TỐI HOÀN HẢO)
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

    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none font-sans">
      
      {/* 🚀 CHAT WINDOW */}
      {isOpen && (
        <div className={`pointer-events-auto w-[400px] h-[650px] rounded-[32px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 transition-all
            ${isDark 
                ? "bg-[#0B1120]/95 border border-white/10 shadow-[0_0_50px_-10px_rgba(37,99,235,0.4)] backdrop-blur-2xl" 
                : "bg-white/90 border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl" // Light Mode: Sứ trắng
            }`}>
          
          {/* --- HEADER: AI VISUALIZER --- */}
          <div className={`relative h-44 flex flex-col items-center justify-center shrink-0 transition-colors duration-500
                ${isDark ? "bg-gradient-to-b from-blue-900/20 to-transparent" : "bg-gradient-to-b from-blue-50 to-transparent"}
          `}>
             {/* Close Button */}
             <button onClick={() => setIsOpen(false)} className={`absolute top-5 right-5 p-2 rounded-full transition-colors z-20
                ${isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}>
                <X size={20} />
            </button>
            
            {/* Animated AI Orb */}
            <div className="relative w-24 h-24 flex items-center justify-center mt-2">
                {isLoading ? (
                    <>
                        <div className="absolute inset-0 rounded-full" 
                             style={{...(isDark ? aiOrbStyleDark : aiOrbStyleLight), animation: 'orb-pulse 1.5s infinite ease-in-out'}}></div>
                        <div className={`absolute inset-2 rounded-full z-10 flex items-center justify-center backdrop-blur-sm
                            ${isDark ? "bg-black/60" : "bg-white/60"}`}>
                            <Sparkles size={28} className={`animate-spin-slow ${isDark ? "text-white" : "text-blue-600"}`} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0 rounded-full opacity-30" style={isDark ? aiOrbStyleDark : aiOrbStyleLight}></div>
                        <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg" 
                             style={{
                                 animation: 'float 3s ease-in-out infinite',
                                 background: isDark ? "linear-gradient(135deg, #3B82F6, #9333EA)" : "linear-gradient(135deg, #FFFFFF, #EFF6FF)"
                             }}>
                            <Sparkles size={32} className={isDark ? "text-white" : "text-blue-500"} />
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-4 text-center z-10">
                <h3 className={`font-bold text-lg tracking-tight ${isDark ? "text-white" : "text-gray-800"}`}>FinBot AI</h3>
                <p className={`text-xs flex items-center justify-center gap-1.5 mt-1 ${isDark ? "text-blue-300/60" : "text-gray-500"}`}>
                    <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
                    {isLoading ? "Processing Request..." : "AI System Online"}
                </p>
            </div>
          </div>

          {/* --- CHAT BODY --- */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar transition-colors duration-300 
                ${isDark ? "bg-gradient-to-b from-transparent to-black/20" : "bg-[#F8FAFC]" /* Light Mode nền xám rất nhạt */ }
          `}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Message Bubble */}
                {msg.content && (
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-md shadow-sm border
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
                
                {/* 1. Chart Widget */}
                {msg.special?.type === 'chart' && (
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
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                        <PieIcon size={12} /> View Full Report
                    </button>
                  </div>
                )}

                {/* Admin Widgets */}
                {msg.special?.type === 'admin_kpi' && <AdminKpiWidget data={msg.special.payload} isDark={isDark} />}
                {msg.special?.type === 'admin_user' && <AdminUserCard data={msg.special.payload} onManage={handleManageUser} isDark={isDark} />}
                {msg.special?.type === 'admin_logs' && <AdminLogsList logs={msg.special.payload} isDark={isDark} />}
                
              </div>
            ))}
            
            {/* Loading Dots */}
            {isLoading && (
                <div className={`flex gap-1.5 items-center ml-2 p-3 w-fit rounded-2xl ${isDark ? "bg-white/5" : "bg-white shadow-sm border border-gray-100"}`}>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* --- INPUT AREA --- */}
          <div className={`p-4 border-t backdrop-blur-xl transition-colors duration-300
                ${isDark ? "bg-black/40 border-white/5" : "bg-white/80 border-gray-100"}
          `}>
            <div className={`relative flex items-center rounded-full border transition-all shadow-inner
                ${isDark 
                    ? "bg-[#1a1f2e] border-white/10 focus-within:border-blue-500/50 focus-within:ring-blue-500/20" 
                    : "bg-gray-100 border-transparent focus-within:bg-white focus-within:border-blue-200 focus-within:ring-blue-100"}
                focus-within:ring-4
            `}>
              <input 
                type="text" 
                value={input} 
                onChange={(e)=>setInput(e.target.value)} 
                onKeyDown={handleKeyPress} 
                className={`flex-1 bg-transparent px-5 py-3.5 text-sm focus:outline-none 
                    ${isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-800 placeholder:text-gray-400"}
                `}
                placeholder="Type a message..." 
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim()} 
                className="absolute right-1.5 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 TOGGLE BUTTON (FLOATING ORB) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="pointer-events-auto group relative w-16 h-16 flex items-center justify-center"
      >
        {/* Glow Effect */}
        <div className={`absolute inset-0 rounded-full blur-xl animate-pulse transition-opacity
            ${isDark 
                ? "bg-blue-500 opacity-40 group-hover:opacity-60" 
                : "bg-blue-400 opacity-30 group-hover:opacity-50"}`}></div>
        
        {/* Main Button */}
        <div className={`relative w-14 h-14 rounded-full border flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-110 transition-transform duration-300
            ${isDark 
                ? "bg-gradient-to-br from-[#1a1f2e] to-black border-white/10" 
                : "bg-white border-white/50"}`}>
            
            {/* Inner Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {isOpen ? (
                <X size={24} className={`${isDark ? "text-white" : "text-gray-600"} relative z-10 transition-transform rotate-90`} />
            ) : (
                <Sparkles size={24} className={`${isDark ? "text-blue-400 group-hover:text-white" : "text-blue-600 group-hover:text-blue-700"} relative z-10 transition-transform group-hover:rotate-12`} />
            )}
        </div>
      </button>

    </div>
    </>
  );
}