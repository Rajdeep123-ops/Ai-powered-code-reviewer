import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, CodeReviewReport, PersonaDef, PersonaId } from "../types";
import { Bot, Send, User, ChevronRight, CornerDownRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FollowUpChatProps {
  code: string;
  language: string;
  report: CodeReviewReport | null;
  personaDef: PersonaDef;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function FollowUpChat({
  code,
  language,
  report,
  personaDef,
  messages,
  setMessages,
}: FollowUpChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch("/api/review/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          report,
          messages: [...messages, userMessage],
          persona: personaDef.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to transmit query to evaluation node.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("No readable response body channel.");
      }

      const replyId = `rev_${Date.now()}`;
      const responseMessage: ChatMessage = {
        id: replyId,
        sender: "reviewer",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, responseMessage]);

      let done = false;
      let accumulatedText = "";
      let buffer = "";

      setIsSending(false); // Enable input sooner once stream begins to arrive

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              const dataStr = cleanLine.slice(6).trim();
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === replyId ? { ...msg, text: accumulatedText } : msg
                    )
                  );
                }
              } catch (e) {
                // Fail-safe for intermediate partial strings
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        sender: "reviewer",
        text: "🚨 **Transmission failure**: Lost connection with evaluation runtime. Try again shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[280px] bg-zinc-900 border border-zinc-805 border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/25 text-sm select-none">
            {personaDef.avatar}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-zinc-200">
              Technical QA Session with {personaDef.name}
            </h4>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide">
              ROLE: {personaDef.role}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-950/30 border border-emerald-900/30 px-2 py-0.5 rounded">
          READY_STATE
        </span>
      </div>

      {/* Messages Feedbox */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/20 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
      >
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div key={m.id} className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-6 h-6 rounded-md border text-xs font-semibold flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                    : "bg-indigo-950/40 border-indigo-900/30 text-indigo-400"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <span>{personaDef.avatar}</span>}
              </div>

              <div className="max-w-[85%] flex flex-col">
                <div
                  className={`px-3 py-2 border rounded-lg text-xs leading-relaxed ${
                    isUser
                      ? "bg-indigo-600/10 text-zinc-150 border-indigo-500/10 rounded-tr-none"
                      : "bg-zinc-900/50 text-zinc-250 border-zinc-800 rounded-tl-none"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <div className="markdown-body text-xs space-y-1">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <span className={`text-[8px] text-zinc-650 font-mono mt-0.5 ${isUser ? "text-right" : ""}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 text-xs flex items-center justify-center">
              <span>{personaDef.avatar}</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded px-3 py-1.5 flex items-center space-x-1.5">
              <span className="text-[10px] text-zinc-500 italic">Thinking...</span>
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
            </div>
          </div>
        )}
      </div>

      {/* Input query form submission */}
      <form
        onSubmit={handleSendMessage}
        className="p-2 border-t border-zinc-800 bg-zinc-950/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!report || isSending}
          placeholder={
            report
              ? `Clarify specific bugs, ask about optimizations, or query ${personaDef.name}...`
              : "Generate a complete code audit on top first before initiating dialogue."
          }
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending || !report}
          className="p-2 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
