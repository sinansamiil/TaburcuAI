import { useState, useEffect, useRef } from "react";
import { useHospital } from "./HospitalContext";
import { getFaqs, askChatbot } from "../api/client";
import type { FAQItem, ChatResponse } from "../types";
import {
  X,
  Send,
  AlertTriangle,
  PhoneCall,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Bot,
  User,
  ExternalLink,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  warning_level?: "info" | "warning" | "danger";
  emergency_detected?: boolean;
  suggested_questions?: string[];
  action_link?: string | null;
  action_text?: string | null;
}

const CATEGORIES = [
  { id: "all", label: "Tümü", icon: "✨" },
  { id: "kidney_failure", label: "Böbrek (KBY)", icon: "🫘" },
  { id: "heart_failure", label: "Kalp Yetmezliği", icon: "❤️" },
  { id: "diabetes_type2", label: "Diyabet", icon: "🩺" },
  { id: "copd_respiratory", label: "KOAH", icon: "🫁" },
  { id: "emergency", label: "Acil Kırmızı Bayrak", icon: "🚨" },
  { id: "system", label: "Sistem & Rehber", icon: "📋" },
];

export function ClinicalChatbot() {
  const { config } = useHospital();
  const primaryCol = config.primary_color || "#1e5ba3";
  const accentCol = config.accent_color || "#d92d20";

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(false);

  // Chat conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "bot",
      text: `Merhaba! Ben ${config.hospital_name || "TaburcuAI"} Akıllı Klinik Danışmanıyım. 
Taburculuk süreciniz, Kronik Böbrek Yetmezliği (KBY), Kalp Yetmezliği, Diyabet veya KOAH ilaçlarınız, tuz/sıvı kısıtlamaları ve acil durumlar hakkında sorularınızı yanıtlayabilirim.
Aşağıdaki sıkça sorulan sorulara tıklayabilir veya aklınıza takılan soruyu yazabilirsiniz.`,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      warning_level: "info",
      suggested_questions: [
        "Böbrek hastasıyım, hangi ağrı kesicileri kullanabilirim?",
        "Fosfat bağlayıcı ilaçlar ne zaman ve nasıl alınır?",
        "Kan şekerim 70 altına düşerse (15-15 Kuralı) ne yapmalıyım?",
        "Hangi belirtilerde derhal 112 Acil Servis aranmalıdır?",
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Load FAQs when category changes
  useEffect(() => {
    setFaqLoading(true);
    getFaqs(activeCategory)
      .then((data) => setFaqs(data))
      .catch(() => {})
      .finally(() => setFaqLoading(false));
  }, [activeCategory]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response: ChatResponse = await askChatbot(query);
      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: response.answer,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        warning_level: response.warning_level,
        emergency_detected: response.emergency_detected,
        suggested_questions: response.suggested_questions,
        action_link: response.action_link,
        action_text: response.action_text,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "Sorunuz klinik rehberlerimizde inceleniyor. Lütfen reçeteli ilaçlarınızı epikrizinizde belirtildiği şekilde alınız ve beklenmeyen bir semptom durumunda hekiminize danışınız.",
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        warning_level: "info",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectFaqQuestion = (faq: FAQItem) => {
    handleSendMessage(faq.question);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-restarted",
        sender: "bot",
        text: `Sohbet temizlendi. ${config.hospital_name || "TaburcuAI"} Klinik Danışmanına dilediğiniz tıbbi taburculuk veya sistem sorusunu sorabilirsiniz.`,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        warning_level: "info",
        suggested_questions: [
          "Böbrek hastasıyım, hangi ağrı kesicileri kullanabilirim?",
          "Fosfat bağlayıcı ilaçlar ne zaman ve nasıl alınır?",
          "Hangi belirtilerde derhal 112 Acil Servis aranmalıdır?",
        ],
      },
    ]);
  };

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON (Bottom-Right) ────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div
            onClick={() => {
              setIsOpen(true);
              setUnreadBadge(false);
            }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl cursor-pointer hover:scale-105 transition group"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-xs font-black text-slate-800">
              Klinik Asistan & SSS
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
              style={{ backgroundColor: primaryCol }}
            >
              7/24
            </span>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setUnreadBadge(false);
          }}
          aria-label="Klinik Asistan Chatbot"
          className="w-14 h-14 rounded-2xl text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative group"
          style={{ backgroundColor: primaryCol }}
        >
          {isOpen ? (
            <X size={26} className="transition-transform group-hover:rotate-90 duration-300" />
          ) : (
            <div className="relative">
              <Bot size={28} className="animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
          )}
          {unreadBadge && !isOpen && (
            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ── CHATBOT MODAL / POPUP ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] h-[640px] max-h-[86vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div
            className="p-4 sm:p-5 text-white flex items-center justify-between shadow-md shrink-0 relative overflow-hidden"
            style={{ backgroundColor: primaryCol }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white text-xl shadow-inner">
                <Bot size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    {config.hospital_name || "TaburcuAI"} Klinik Danışman
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium mt-0.5">
                  Doğrulanmış Sıkça Sorulan Sorular & Tıbbi Rehber
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                title="Sohbeti Temizle"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Kapat"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Quick Category Chips Strip */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f8fafc]">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isDanger = msg.warning_level === "danger" || msg.emergency_detected;
              const isWarning = msg.warning_level === "warning";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs text-white shadow-xs ${
                      isUser
                        ? "bg-slate-700"
                        : isDanger
                        ? "bg-red-600 animate-pulse"
                        : "bg-[#1e5ba3]"
                    }`}
                  >
                    {isUser ? <User size={15} /> : isDanger ? <ShieldAlert size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs space-y-2 card-shadow ${
                      isUser
                        ? "bg-slate-900 text-white rounded-tr-none font-medium"
                        : isDanger
                        ? "bg-red-50 border-2 border-red-300 text-red-950 rounded-tl-none font-medium shadow-red-100"
                        : isWarning
                        ? "bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-none font-medium"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none leading-relaxed"
                    }`}
                  >
                    {/* Header tag for critical clinical warnings */}
                    {isDanger && (
                      <div className="flex items-center gap-1.5 text-red-700 font-black uppercase text-[10px] tracking-wider pb-1 border-b border-red-200">
                        <AlertTriangle size={14} className="text-red-600" />
                        <span>Kritik Klinik Güvenlik Uyarısı</span>
                      </div>
                    )}

                    {isWarning && (
                      <div className="flex items-center gap-1.5 text-amber-800 font-black uppercase text-[10px] tracking-wider pb-1 border-b border-amber-200">
                        <AlertTriangle size={14} className="text-amber-700" />
                        <span>Önemli Tedavi & İlaç Kuralı</span>
                      </div>
                    )}

                    {/* Text formatting */}
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Action Button (e.g. 112 Call or Plan Link) */}
                    {msg.action_link && (
                      <div className="pt-1.5">
                        <a
                          href={msg.action_link}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm transition ${
                            isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#1e5ba3] hover:bg-[#154680]"
                          }`}
                        >
                          {msg.action_link.startsWith("tel:") ? <PhoneCall size={13} /> : <ExternalLink size={13} />}
                          <span>{msg.action_text || "Hemen İncele"}</span>
                        </a>
                      </div>
                    )}

                    {/* Clickable Suggested Questions */}
                    {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          İlgili Sorular:
                        </span>
                        <div className="flex flex-col gap-1">
                          {msg.suggested_questions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(q)}
                              className="text-left text-[11px] p-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#1e5ba3] border border-slate-200/70 transition font-medium flex items-center justify-between group cursor-pointer"
                            >
                              <span>{q}</span>
                              <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`text-[9px] pt-1 text-right font-mono ${isUser ? "text-slate-400" : "text-slate-400"}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2 bg-white rounded-xl border border-slate-200 max-w-[180px]">
                <Bot size={14} className="text-[#1e5ba3] animate-pulse" />
                <span>Asistan yazıyor...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Instant FAQ Quick-Pick Accordion Drawer (Collapsible) */}
          {faqs.length > 0 && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HelpCircle size={12} />
                  <span>Sıkça Sorulan Sorular ({faqs.length})</span>
                </span>
                <span className="text-[10px] text-blue-600 font-bold">Tek tıkla sor</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {faqLoading ? (
                  <span className="text-[11px] text-slate-400">Yükleniyor...</span>
                ) : (
                  faqs.slice(0, 5).map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => handleSelectFaqQuestion(faq)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 text-[11px] font-bold shrink-0 transition text-left max-w-[240px] truncate cursor-pointer hover:border-blue-300"
                    >
                      {faq.question}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Örn: Böbrek hastası apranax içebilir mi? Veya 112..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1e5ba3] font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl text-white shadow-md transition cursor-pointer disabled:opacity-40 hover:scale-105 active:scale-95"
                style={{ backgroundColor: inputText.trim() ? accentCol : primaryCol }}
                title="Gönder"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 pt-1.5 font-medium">
              <span>🩺 Yapay zeka destekli klinik bilgi asistanı</span>
              <span className="text-rose-500 font-bold">Acil durumda: 112</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
