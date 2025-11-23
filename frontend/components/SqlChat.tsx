"use client";

import { useState } from "react";
import { uploadSchema, sendChat } from "../lib/api";

type ChatMessage = {
    role: "user" | "assistant";
    text: string;
    sql?: string;
    result?: any;
};

export default function SqlChat() {
    const [connectionId, setConnectionId] = useState("default");
    const [ddl, setDdl] = useState("");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    async function handleUploadSchema() {
        const res = await uploadSchema(connectionId, ddl);
        if (res.error) {
            alert("Upload schema error: " + res.error);
        } else {
            alert("Schema uploaded");
        }
    }

    async function handleSend() {
        if (!input.trim()) return;
        const userMsg: ChatMessage = { role: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const res = await sendChat(connectionId, userMsg.text);
            if (res.error) {
                const errMsg: ChatMessage = {
                    role: "assistant",
                    text: "Error: " + res.error
                };
                setMessages((prev) => [...prev, errMsg]);
            } else {
                const assistantMsg: ChatMessage = {
                    role: "assistant",
                    text: res.analysis || "Query executed.",
                    sql: res.sql,
                    result: res.result
                };
                setMessages((prev) => [...prev, assistantMsg]);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-8 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Dynamic SQL Chat (Llama + MSSQL)</h1>

            <div className="border p-4 rounded space-y-2">
                <h2 className="font-semibold">1. Connection & Schema</h2>
                <div className="flex gap-2">
                    <input
                        className="border p-2 flex-1"
                        value={connectionId}
                        onChange={(e) => setConnectionId(e.target.value)}
                        placeholder="connectionId (e.g., default)"
                    />
                    <button
                        className="border px-3 py-2 rounded"
                        onClick={handleUploadSchema}
                    >
                        Upload Schema
                    </button>
                </div>
                <textarea
                    className="border w-full p-2 h-40 mt-2 font-mono text-sm"
                    value={ddl}
                    onChange={(e) => setDdl(e.target.value)}
                    placeholder={`Paste your MSSQL DDL here, e.g.

CREATE TABLE [food_logs] (
  [id] INT,
  [user_id] INT,
  [food_name] VARCHAR(255),
  [calories] INT,
  [created_at] DATETIME
);
`}
                />
            </div>

            <div className="border p-4 rounded flex-1 flex flex-col">
                <h2 className="font-semibold mb-2">2. Chat</h2>
                <div className="flex-1 overflow-y-auto border p-2 rounded mb-2 space-y-3">
                    {messages.map((m, idx) => (
                        <div key={idx}>
                            <div className={m.role === "user" ? "font-semibold" : ""}>
                                {m.role === "user" ? "You:" : "Assistant:"} {m.text}
                            </div>
                            {m.sql && (
                                <pre className="bg-gray-900 text-gray-100 text-xs p-2 rounded mt-1 overflow-x-auto">
                                    {m.sql}
                                </pre>
                            )}
                            {m.result && (
                                <pre className="bg-gray-100 text-xs p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(m.result, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-sm text-gray-500">
                            Upload schema ก่อน แล้วลองถามเช่น: "ดูรายการ food_logs 10 แถวแรก"
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        className="border p-2 flex-1"
                        value={input}
                        disabled={loading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="ถามด้วยภาษาคน เช่น 'สรุปยอด calories วันนี้' หรือ 'select 10 แถวแรกจาก food_logs'"
                    />
                    <button
                        className="border px-4 py-2 rounded"
                        onClick={handleSend}
                        disabled={loading}
                    >
                        {loading ? "..." : "Send"}
                    </button>
                    <button
                        className="border px-3 py-2 rounded"
                        onClick={async () => {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/schema/refresh`, { method: "POST" });
                            const json = await res.json();
                            alert("Schema loaded!");
                        }}
                    >
                        Load Schema from Database
                    </button>

                </div>
            </div>
        </div>
    );
}
