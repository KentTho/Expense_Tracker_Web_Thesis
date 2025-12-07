import React, { useState, useRef, useEffect } from "react";
import { 
    MessageSquare, X, Send, Loader2, Bot, 
    PieChart as PieIcon, Users, Activity, Shield, Clock, DollarSign, User, Settings
} from "lucide-react";
import { sendChatMessage } from "../services/chatService";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom"; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// ==================================================================================
// 🎨 UI COMPONENTS CHO ADMIN (ĐẸP MẮT & HIỆN ĐẠI)
// ==================================================================================

// 1. KPI WIDGET (4 Ô VUÔNG) - Đã tinh chỉnh UI
const AdminKpiWidget = ({ data }) => (
    <div className="mt-3 w-full">
        <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
            <Activity size={10} /> System Health
        </p>
        <div className="grid grid-cols-2 gap-2">
            {/* Card 1: Total Users */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col justify-center items-center shadow-sm hover:shadow-md transition-all">
                <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-full mb-1">
                    <Users size={14} className="text-blue-600 dark:text-blue-300" />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Users</span>
                <span className="text-lg font-extrabold text-gray-800 dark:text-gray-100">{data.users}</span>
            </div>

            {/* Card 2: Balance */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800 flex flex-col justify-center items-center shadow-sm hover:shadow-md transition-all">
                 <div className="bg-emerald-100 dark:bg-emerald-800 p-1.5 rounded-full mb-1">
                    <DollarSign size={14} className="text-emerald-600 dark:text-emerald-300" />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Balance</span>
                <span className="text-lg font-extrabold text-gray-800 dark:text-gray-100">
                    ${(data.balance / 1000).toFixed(0)}k
                </span>
            </div>

            {/* Card 3: New Users */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800 flex flex-col justify-center items-center shadow-sm hover:shadow-md transition-all">
                 <div className="bg-purple-100 dark:bg-purple-800 p-1.5 rounded-full mb-1">
                    <Clock size={14} className="text-purple-600 dark:text-purple-300" />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">New (24h)</span>
                <span className="text-lg font-extrabold text-purple-600 dark:text-purple-300">+{data.new_users}</span>
            </div>

            {/* Card 4: 2FA Security */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 flex flex-col justify-center items-center shadow-sm hover:shadow-md transition-all">
                 <div className="bg-orange-100 dark:bg-orange-800 p-1.5 rounded-full mb-1">
                    <Shield size={14} className="text-orange-600 dark:text-orange-300" />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">2FA Active</span>
                <span className="text-lg font-extrabold text-orange-600 dark:text-orange-300">{data['2fa']}</span>
            </div>
        </div>
        
        {/* Summary Text */}
        <div className="mt-2 text-[10px] text-center text-gray-400">
            Total Flow: <span className="text-green-500">+{new Intl.NumberFormat().format(data.income)}</span> / <span className="text-red-500">-{new Intl.NumberFormat().format(data.expense)}</span>
        </div>
    </div>
);

// 2. USER CARD (CĂN CƯỚC CÔNG DÂN)
const AdminUserCard = ({ data, onManage }) => (
    <div className="mt-3 w-full bg-white dark:bg-gray-800 p-0 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg shadow-inner">
                {data.name ? data.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="text-white overflow-hidden">
                <h4 className="font-bold text-sm truncate">{data.name}</h4>
                <p className="text-[10px] opacity-80 truncate">{data.email}</p>
            </div>
        </div>
        <div className="p-3">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-3">
                <div><span className="text-gray-400 block">Role</span><span className="font-bold dark:text-gray-200">{data.role}</span></div>
                <div><span className="text-gray-400 block">Joined</span><span className="font-bold dark:text-gray-200">{data.joined}</span></div>
                <div><span className="text-gray-400 block">Status</span><span className="text-green-500 font-bold">Active</span></div>
                <div><span className="text-gray-400 block">2FA</span><span className={data['2fa_status'] === 'Enabled' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{data['2fa_status']}</span></div>
            </div>
            <button 
                onClick={() => onManage(data.email)}
                className="w-full py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
            >
                <Settings size={12} /> Manage User
            </button>
        </div>
    </div>
);

// 3. LOGS LIST (TERMINAL STYLE)
const AdminLogsList = ({ logs }) => (
    <div className="mt-3 w-full bg-[#1e1e1e] text-green-400 p-3 rounded-xl font-mono text-[10px] shadow-lg border border-gray-700">
        <div className="flex justify-between items-center border-b border-green-800/50 pb-1 mb-2">
            <span className="font-bold">SYSTEM_LOGS</span>
            <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><div className="w-2 h-2 rounded-full bg-yellow-500"></div><div className="w-2 h-2 rounded-full bg-green-500"></div></div>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {logs.map((log, i) => (
                <div key={i} className="flex flex-col border-l-2 border-green-900 pl-2">
                    <div className="flex justify-between opacity-60 text-[9px]">
                        <span>{log.time}</span>
                        <span>{log.admin.split('@')[0]}</span>
                    </div>
                    <div className="flex gap-1">
                        <span className={log.status === 'SUCCESS' ? 'text-blue-400' : 'text-red-500'}>$ {log.action}</span>
                    </div>
                    <span className="text-gray-400 truncate">{log.details}</span>
                </div>
            ))}
        </div>
    </div>
);

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function FinBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "👋 Chào bạn! Tôi là FinBot. Tôi có thể giúp gì cho ví tiền của bạn hôm nay?" }
  ]);
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
      let specialData = { type: null, payload: null };

      // 1. Xử lý REFRESH
      if (botReply.includes("[REFRESH]")) {
          botReply = botReply.replace("[REFRESH]", "").trim();
          window.dispatchEvent(new Event("transactionUpdated"));
      }

      // 2. Xử lý CHART (Biểu đồ)
      const chartMatch = botReply.match(/\[CHART_DATA_START\]([\s\S]*?)\[CHART_DATA_END\]/);
      if (chartMatch) {
          try {
              specialData = { type: 'chart', payload: JSON.parse(chartMatch[1]) };
              botReply = botReply.replace(chartMatch[0], "").trim();
          } catch (e) {}
      }

      // 3. Xử lý ADMIN KPI
      const kpiMatch = botReply.match(/\[ADMIN_KPI_DATA\]([\s\S]*?)\[\/ADMIN_KPI_DATA\]/);
      if (kpiMatch) {
          try {
              specialData = { type: 'admin_kpi', payload: JSON.parse(kpiMatch[1]) };
              botReply = botReply.replace(kpiMatch[0], "").trim();
          } catch (e) {}
      }

      // 4. Xử lý ADMIN LOGS
      const logsMatch = botReply.match(/\[ADMIN_LOGS_DATA\]([\s\S]*?)\[\/ADMIN_LOGS_DATA\]/);
      if (logsMatch) {
          try {
              specialData = { type: 'admin_logs', payload: JSON.parse(logsMatch[1]) };
              botReply = botReply.replace(logsMatch[0], "").trim();
          } catch (e) {}
      }

      // 5. Xử lý ADMIN USER SEARCH
      const userMatch = botReply.match(/\[ADMIN_USER_DATA\]([\s\S]*?)\[\/ADMIN_USER_DATA\]/);
      if (userMatch) {
          try {
              specialData = { type: 'admin_user', payload: JSON.parse(userMatch[1]) };
              botReply = botReply.replace(userMatch[0], "").trim();
          } catch (e) {}
      }

      const botMsg = { role: "bot", content: botReply, special: specialData };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Lỗi kết nối hoặc hệ thống quá tải." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageUser = (email) => {
      setIsOpen(false);
      navigate("/admin/users"); // Chuyển hướng sang trang quản lý
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleSend(); };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto w-[380px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full"><Bot size={20} /></div>
              <div><h3 className="font-bold text-sm">FinBot AI</h3><p className="text-[10px] opacity-80">Financial Assistant</p></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded"><X size={18} /></button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-[#0B1120]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Text Bubble */}
                {msg.content && (
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700"}`}>
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                )}

                {/* 🎨 RENDER WIDGETS */}
                
                {/* Biểu đồ Pie */}
                {msg.special?.type === 'chart' && (
                    <div className="mt-2 w-full max-w-[95%] bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                        <p className="text-xs font-bold text-gray-500 mb-2 text-center uppercase">{msg.special.payload.title}</p>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={msg.special.payload.data} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                                        {msg.special.payload.data.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} />)}
                                    </Pie>
                                    <Tooltip formatter={(val) => new Intl.NumberFormat('en-US').format(val)} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <button onClick={() => {setIsOpen(false); navigate("/analytics")}} className="w-full mt-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-1">
                            <PieIcon size={12} /> View Analytics
                        </button>
                    </div>
                )}

                {/* Admin KPI Widget */}
                {msg.special?.type === 'admin_kpi' && <AdminKpiWidget data={msg.special.payload} />}

                {/* Admin User Card */}
                {msg.special?.type === 'admin_user' && <AdminUserCard data={msg.special.payload} onManage={handleManageUser} />}

                {/* Admin Logs List */}
                {msg.special?.type === 'admin_logs' && <AdminLogsList logs={msg.special.payload} />}

              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-white dark:bg-gray-800 p-2.5 rounded-2xl rounded-tl-none border dark:border-gray-700"><Loader2 size={16} className="animate-spin text-blue-500" /></div></div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
             <input type="text" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={handleKeyPress} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400" placeholder="Nhập tin nhắn..." />
             <button onClick={handleSend} disabled={!input.trim()} className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md transition disabled:opacity-50"><Send size={16} /></button>
           </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="pointer-events-auto p-4 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-2xl hover:scale-105 transition-transform active:scale-95"><Bot size={28} /></button>
    </div>
  );
}