"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Bot,
  CheckCircle2,
  FileText,
  MessageCircleMore,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { careerApi } from "../services/apiClient";

const SUGGESTIONS = [
  "Tôi phù hợp với công ty nào?",
  "So sánh VinFast và VinAI",
  "Cập nhật danh sách công ty",
];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Chào bạn! Mình có thể tư vấn từ dữ liệu công ty hiện có. Hãy tải CV ở Portfolio để nhận Top 3 phù hợp.",
};

export default function FloatingAIChat({ portfolioId, onNavigate, notify }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isOpen]);

  const sendMessage = async (question = input) => {
    const content = question.trim();
    if (!content || isSending) return;

    const userMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const result = await careerApi.chat({
        message: content,
        portfolioId,
        history: nextMessages,
      });
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result?.answer || "Agent chưa trả về nội dung.",
          trace: result?.tool_trace || [],
          matches: result?.matches || [],
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent gặp lỗi.";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
          isError: true,
        },
      ]);
      notify?.(message, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="floating-chat-root">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="floating-chat-panel"
            aria-label="Trợ lý VinCareer AI"
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22 }}
          >
            <header className="floating-chat-header">
              <span className="assistant-avatar"><Bot size={19} /></span>
              <span>
                <strong>VinCareer AI</strong>
                <small><i /> Agent đang trực tuyến</small>
              </span>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat">
                <X size={16} />
              </button>
            </header>

            <div className="floating-chat-messages" aria-live="polite">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`floating-message ${
                    message.role === "user" ? "floating-message--user" : ""
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>{message.role === "user" ? "Bạn" : "VinCareer AI"}</span>
                  <p>{message.content}</p>
                  {message.trace?.length > 0 && (
                    <div className="message-agent-trace">
                      <span><CheckCircle2 size={12} /> Agent & Tools</span>
                      {message.trace.map((step, index) => (
                        <small key={`${step.tool}-${index}`}>
                          <CheckCircle2 size={10} /> {step.message}
                        </small>
                      ))}
                    </div>
                  )}
                  {message.matches?.length > 0 && (
                    <button type="button" onClick={() => onNavigate("portfolio")}>
                      <FileText size={12} /> Xem Portfolio và kết quả
                    </button>
                  )}
                </motion.div>
              ))}
              {isSending && (
                <div className="floating-message">
                  <span>VinCareer AI</span>
                  <div className="typing-dots"><i /><i /><i /></div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            <div className="floating-chat-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={isSending}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="floating-chat-composer" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Hỏi về công ty, kỹ năng, CV..."
                aria-label="Nhập câu hỏi cho AI"
                disabled={isSending}
              />
              <button type="submit" disabled={!input.trim() || isSending} aria-label="Gửi">
                <Send size={16} />
              </button>
            </form>

            {!portfolioId && (
              <button
                className="floating-chat-open-page"
                type="button"
                onClick={() => onNavigate("portfolio")}
              >
                <FileText size={12} /> Tải CV để cá nhân hóa câu trả lời
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        className={`floating-chat-launcher ${isOpen ? "is-open" : ""}`}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
      >
        {isOpen ? <X size={20} /> : <MessageCircleMore size={20} />}
        {!isOpen && <span>Hỏi VinCareer AI</span>}
      </motion.button>
    </div>
  );
}
