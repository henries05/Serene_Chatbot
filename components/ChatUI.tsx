"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Menu, Plus, Star, AlertTriangle, ChevronDown, Sparkles, Smile } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "I'm feeling overwhelmed with work 😖",
  "Can you give me a virtual hug? 🥺",
  "I feel unmotivated today 😶",
  "Tell me something positive! ✨"
];

const CRISIS_KEYWORDS = ["suicide", "kill myself", "die", "end it all", "jump off", "cut myself", "harm myself"];

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hello there! 👋 I'm **Serene**, your positive AI companion! \n\nHow are you feeling today? (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ \nWhether you want to vent, need some cheering up, or just want to look at imaginary cute animals together, I'm here for you!🐶🌻"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const hasCrisis = messages.some(m => 
    m.role === 'user' && CRISIS_KEYWORDS.some(k => m.content.toLowerCase().includes(k))
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Connection error");
      }
      if (!res.body) throw new Error("No data returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        setMessages((prev) => 
          prev.map((msg) => msg.id === aiMsgId ? { ...msg, content: msg.content + chunkValue } : msg)
        );
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || "Oops! I tripped over a wire and can't connect right now. 🐶🔌 Please try again soon!";
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Do you want to start a fresh new chat? ✨")) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Hello there! 👋 I'm **Serene**, your positive AI companion! \n\nHow are you feeling today? (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧"
      }]);
    }
  }

  return (
    <div className="flex h-screen w-full font-sans bg-background text-foreground overflow-hidden">
      {/* SIDEBAR */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-20 w-64 transform bg-[#fffae8] border-r border-border transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shadow-[4px_0_24px_rgba(245,158,11,0.05)]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex items-center justify-between">
          <div className="font-bold flex items-center gap-2 text-primary-foreground bg-primary px-4 py-2 rounded-[1rem] shadow-sm text-sm">
            <Sparkles size={18} className="animate-pulse" />
            <span>Serene 🌻</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-primary hover:text-primary-foreground bg-accent hover:bg-primary transition-colors p-1.5 rounded-xl">
            <ChevronDown size={20} className="rotate-90"/>
          </button>
        </div>
        
        <div className="px-4 mb-4">
          <button 
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-border hover:bg-accent text-foreground py-2.5 px-4 rounded-[1.2rem] transition-colors shadow-sm text-sm font-bold"
          >
            <Plus size={18} /> New Chat 🐾
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-2 ml-1">Recent Chats</p>
          <div className="p-3 bg-white border-2 border-transparent hover:border-border rounded-2xl text-sm text-foreground truncate cursor-pointer shadow-sm transition-all">
            {messages.length > 1 ? messages[1].content : "A brand new day! ✨"}
          </div>
        </div>

        {/* Fun decor in sidebar */}
        <div className="p-4 flex justify-center gap-3 text-2xl opacity-80 pb-6 border-t border-border/50">
          <span>🐶</span>
          <span>🌈</span>
          <span>🌻</span>
        </div>
        
        <div className="p-3 pb-safe bg-accent/30 text-[10px] text-muted-foreground text-center font-medium">
          Not a replacement for professional medical advice.
        </div>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-primary/10 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative bg-fun-pattern">
        {/* Header */}
        <header className="h-16 flex items-center px-4 border-b border-border bg-white/70 backdrop-blur-md z-10 shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-3 p-2 bg-accent hover:bg-primary hover:text-primary-foreground rounded-xl text-primary transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
            Chat with Serene <Smile size={20} className="text-primary"/>
          </h1>
        </header>

        {/* Crisis Banner */}
        {hasCrisis && (
          <div className="bg-destructive text-destructive-foreground px-5 py-4 flex gap-3 text-sm shrink-0 shadow-md z-10 items-start">
            <AlertTriangle className="shrink-0 mt-0.5 animate-pulse" size={20} />
            <div>
              <strong className="block mb-1 text-base">Safe & Emergency Zone:</strong>
              If you are feeling completely overwhelmed, please remember that there is always someone ready to listen and help.
              Please call the emergency hotline immediately: <strong>911</strong> (Emergency Services) or <strong>988</strong> (Suicide & Crisis Lifeline). You are not alone.
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:px-12 flex flex-col relative z-0">
          <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start group")}>
                 {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-[1.2rem] bg-[#fffbed] border-2 border-primary flex items-center justify-center shrink-0 mr-3 shadow-sm transform group-hover:rotate-12 transition-transform duration-300">
                    <Star size={20} fill="#f59e0b" className="text-primary" />
                  </div>
                 )}
                 <div className={cn(
                   "px-5 py-4 shadow-sm relative",
                   msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-[1.5rem] rounded-tr-md font-medium" 
                    : "bg-white border-2 border-border text-foreground rounded-[1.5rem] rounded-tl-md prose prose-sm sm:prose-base marker:text-primary"
                 )}>
                   {msg.role === 'assistant' ? (
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                   ) : (
                     <p className="whitespace-pre-wrap m-0 font-medium">{msg.content}</p>
                   )}
                 </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-10 h-10 rounded-[1.2rem] bg-[#fffbed] border-2 border-primary flex items-center justify-center shrink-0 mr-3 shadow-sm animate-pulse">
                  <Star size={20} fill="#f59e0b" className="text-primary" />
                </div>
                <div className="px-6 py-5 bg-white border-2 border-border text-muted-foreground rounded-[1.5rem] rounded-tl-md flex gap-1.5 items-center shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-150" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 py-4 bg-white/70 backdrop-blur-md border-t-2 border-border shrink-0 z-10 pb-safe shadow-[0_-4px_24px_rgba(245,158,11,0.08)]">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {messages.length === 1 && (
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => sendMessage(s)}
                    className="text-xs sm:text-sm bg-[#fffbed] border-2 border-border text-foreground font-medium hover:bg-primary hover:border-primary hover:text-primary-foreground px-4 py-2 rounded-full transition-all shadow-sm transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-end gap-2 bg-white border-2 border-border p-2 rounded-[1.5rem] shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-medium"
            >
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Share your thoughts..."
                className="w-full max-h-32 min-h-[48px] bg-transparent resize-none outline-none py-3 px-4 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-orange-500 text-primary-foreground p-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:hover:bg-primary shrink-0 mb-0.5 shadow-sm transform hover:scale-105 active:scale-95"
              >
                <Send size={20} fill="currentColor" />
              </button>
            </form>
            <div className="text-center w-full text-[11px] font-medium text-muted-foreground mt-1 tracking-wide">
              AI-generated responses. Keep sensitive information private. 🐾
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
