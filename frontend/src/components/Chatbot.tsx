import { useState } from "react";
import axios from "axios";
import {
  Bot,
  X,
  Send,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your DealFlow360 Assistant. I can guide you about discount limits, quotations, confirmation, and bills. Try asking: How much discount does a Silver member get?",
      sender: "bot",
    },
  ]);

  const suggestedQuestions = [
    "How much discount does a Silver member get?",
    "How do I generate a quotation?",
    "How do I download my bill?",
  ];

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        text: message,
        sender: "user",
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/chat",
        { message }
      );

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          text:
            response.data.reply ||
            "I couldn't generate a response.",
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          text: "Sorry, I couldn't connect to the AI service.",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[100] flex h-[600px] w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <Bot size={22} />
              </div>

              <div>
                <h2 className="font-semibold">
                  DealFlow360 AI
                </h2>

                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  AI Assistant
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    message.sender === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Thinking...
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Try asking</p>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      setInput(question);
                    }}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask DealFlow360 AI..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-gray-400">
              DealFlow360 help assistant
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:scale-105 hover:bg-blue-700"
          aria-label="Open DealFlow360 AI"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </>
  );
}