import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastMessage {
  id: number;
  kind: "success" | "error";
  text: string;
}

let listeners: ((msg: ToastMessage) => void)[] = [];
let counter = 0;

export const toast = {
  success: (text: string) => emit("success", text),
  error: (text: string) => emit("error", text),
};

function emit(kind: ToastMessage["kind"], text: string) {
  const msg: ToastMessage = { id: ++counter, kind, text };
  listeners.forEach((fn) => fn(msg));
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 4000);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-md bg-raised
            ${m.kind === "success" ? "border-green-600/40 text-primary" : "border-error/40 text-primary"}`}
        >
          {m.kind === "success" ? (
            <CheckCircle2 className="size-4 text-green-600 shrink-0" />
          ) : (
            <XCircle className="size-4 text-error shrink-0" />
          )}
          <span>{m.text}</span>
          <button
            className="ml-2 text-secondary hover:text-primary"
            onClick={() => setMessages((prev) => prev.filter((x) => x.id !== m.id))}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
