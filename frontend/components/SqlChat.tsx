"use client";

import { useEffect, useMemo, useState } from "react";
import { refreshSchema, sendChat } from "../lib/api";

type ChatMessage = {
    role: "user" | "assistant";
    text: string;
    sql?: string;
    result?: any;
};

const suggestionPhrases = [
    "โหลด schema แล้วสรุปตารางหลักให้หน่อย",
    "แสดง 10 แถวล่าสุดจาก food_logs",
    "หาค่าเฉลี่ย calories ต่อวัน",
    "แนะนำ insight ที่น่าสนใจจากข้อมูล"
];

// Loading spinner component
const Spinner = () => (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]">
        <span className="sr-only">Loading...</span>
    </div>
);

// Result table component
const ResultTable = ({ data }: { data: any }) => {
    // Check if data is an array with objects
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 font-mono">
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    }

    // Get column names from first object
    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                            #
                        </th>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="px-3 py-2 text-left font-semibold text-slate-700 border-r border-slate-200 last:border-r-0"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200 font-medium">
                                {idx + 1}
                            </td>
                            {columns.map((col) => (
                                <td
                                    key={col}
                                    className="px-3 py-2 text-slate-700 border-r border-slate-200 last:border-r-0"
                                >
                                    {row[col] !== null && row[col] !== undefined
                                        ? String(row[col])
                                        : <span className="text-slate-400 italic">null</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="bg-slate-50 px-3 py-2 text-xs text-slate-500 border-t border-slate-200">
                <span className="font-medium">{data.length}</span> แถว
            </div>
        </div>
    );
};

export default function SqlChat() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [schema, setSchema] = useState<Record<string, { name: string; type: string }[]> | null>(null);
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [schemaError, setSchemaError] = useState<string | null>(null);

    const schemaSummary = useMemo(() => {
        if (!schema) return null;
        return schema;
    }, [schema]);

    useEffect(() => {
        loadSchema();
    }, []);

    async function loadSchema(showToast = false) {
        setSchemaLoading(true);
        setSchemaError(null);
        try {
            const res = await refreshSchema();
            if (res?.error || !res?.schema) {
                const message = res?.error || "Schema not found";
                setSchemaError(message);
                if (showToast) alert("Load schema error: " + message);
            } else {
                setSchema(res.schema);
                if (showToast) alert("Schema loaded from database");
            }
        } catch (err: any) {
            const message = err?.message || "Failed to load schema";
            setSchemaError(message);
            if (showToast) alert(message);
        } finally {
            setSchemaLoading(false);
        }
    }

    async function handleSend() {
        if (!input.trim()) return;
        if (!schema) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "โปรดโหลด schema จากฐานข้อมูลก่อนเริ่มถามคำถาม"
                }
            ]);
            return;
        }
        const userMsg: ChatMessage = { role: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const res = await sendChat(userMsg.text);
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

    const schemaStatus = schemaLoading
        ? { label: "กำลังโหลด schema", tone: "bg-amber-100 text-amber-800 border-amber-200" }
        : schema
          ? { label: "พร้อมใช้งาน", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" }
          : schemaError
            ? { label: "โหลด schema ไม่สำเร็จ", tone: "bg-red-100 text-red-800 border-red-200" }
            : { label: "ยังไม่ได้โหลด", tone: "bg-slate-100 text-slate-700 border-slate-200" };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 lg:px-6 flex flex-col gap-6">
            {/* Hero Header - Clean & Professional */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800" />
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="relative p-8 lg:p-10 flex flex-col gap-5 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-300">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                                <span>SQL Chat Assistant</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                                Dynamic SQL Chat
                            </h1>
                            <p className="text-slate-300 text-sm">
                                Powered by Llama + MSSQL
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 self-start rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm">
                            <span className={`h-2 w-2 rounded-full ${schema ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                            <span className="font-medium">{schemaStatus.label}</span>
                        </div>
                    </div>

                    <p className="text-slate-200 text-sm max-w-3xl leading-relaxed">
                        โหลด schema จากฐานข้อมูล MSSQL แล้วสนทนาถาม-ตอบเป็นภาษาไทย หรือให้ AI สร้างคำสั่ง SQL และรันผลลัพธ์ให้ทันที
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Schema Panel - Clean */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1">
                            <h2 className="text-base font-semibold text-slate-900 mb-1">Database Schema</h2>
                            <p className="text-xs text-slate-500">
                                โครงสร้างฐานข้อมูล MSSQL
                            </p>
                        </div>
                        <span className={`rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${schemaStatus.tone}`}>
                            {schemaStatus.label}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => loadSchema(true)}
                            disabled={schemaLoading}
                        >
                            {schemaLoading ? (
                                <>
                                    <Spinner />
                                    โหลดอยู่...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </>
                            )}
                        </button>
                        <button
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                            onClick={() => setMessages([])}
                            title="ล้างข้อความ"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {schemaError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            <div className="flex items-start gap-2">
                                <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{schemaError}</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span className="text-xs font-semibold text-slate-700">Tables</span>
                            </div>
                            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {schema ? Object.keys(schema).length : 0}
                            </span>
                        </div>
                        <div className="h-72 overflow-y-auto bg-white">
                            {schema ? (
                                <div className="divide-y divide-slate-200">
                                    {Object.entries(schema).map(([tableName, columns]) => (
                                        <div key={tableName} className="group">
                                            {/* Table Header */}
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors">
                                                <svg className="h-3.5 w-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                </svg>
                                                <span className="text-xs font-semibold text-slate-900">{tableName}</span>
                                                <span className="text-xs text-slate-500">({columns.length})</span>
                                            </div>
                                            {/* Columns */}
                                            <div className="bg-white">
                                                {columns.map((col, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2 px-6 py-1.5 hover:bg-slate-50 border-l-2 border-transparent hover:border-blue-500 transition-all"
                                                    >
                                                        <svg className="h-3 w-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-xs font-medium text-slate-700 min-w-[120px]">
                                                            {col.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                                                            {col.type}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-4">
                                    <svg className="h-12 w-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                    <p className="text-sm font-medium text-slate-500">ยังไม่ได้โหลด schema</p>
                                    <p className="text-xs text-slate-400 mt-1">กดปุ่ม Refresh เพื่อโหลด</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Interface - Clean */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 mb-1">Chat</h2>
                            <p className="text-xs text-slate-500">ถามคำถามหรือสั่งสร้าง SQL</p>
                        </div>

                        {/* Suggestion Pills */}
                        <div className="flex flex-wrap gap-2">
                            {suggestionPhrases.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 hover:border-slate-300"
                                    onClick={() => setInput(suggestion)}
                                >
                                    <svg className="h-3 w-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        {/* Messages Area - Clean */}
                        <div className="min-h-[380px] max-h-[500px] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] space-y-2 rounded-lg px-4 py-3 ${
                                            m.role === "user"
                                                ? "bg-slate-900 text-white"
                                                : "bg-white border border-slate-200 text-slate-900"
                                        }`}
                                    >
                                        {/* Message Header */}
                                        <div className="flex items-center gap-2 text-xs font-medium">
                                            <span className={m.role === "user" ? "text-slate-300" : "text-slate-500"}>
                                                {m.role === "user" ? "คุณ" : "AI"}
                                            </span>
                                        </div>

                                        {/* Message Text */}
                                        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                            m.role === "user" ? "text-white" : "text-slate-700"
                                        }`}>
                                            {m.text}
                                        </div>

                                        {/* SQL Code Block */}
                                        {m.sql && (
                                            <div className="relative mt-2">
                                                <div className="absolute right-2 top-2 rounded bg-slate-700/80 px-2 py-0.5 text-[10px] font-medium text-slate-200">
                                                    SQL
                                                </div>
                                                <pre className="overflow-x-auto rounded-md bg-slate-900 px-3 py-2.5 text-xs text-emerald-400 font-mono">
                                                    {m.sql}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Result Block */}
                                        {m.result && (
                                            <div className="relative mt-2">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <div className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                                                        Result
                                                    </div>
                                                </div>
                                                <ResultTable data={m.result} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {messages.length === 0 && (
                                <div className="flex h-full min-h-[340px] flex-col items-center justify-center p-8 text-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                        <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 mb-1">เริ่มต้นการสนทนา</p>
                                    <p className="text-xs text-slate-500 max-w-md">
                                        ลองถามคำถามหรือเลือกจากคำแนะนำด้านบน
                                    </p>
                                </div>
                            )}

                            {/* Loading Indicator */}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="rounded-lg bg-white border border-slate-200 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Spinner />
                                            <span className="text-sm text-slate-600">กำลังประมวลผล...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area - Clean */}
                        <div className="border-t border-slate-200 pt-4">
                            <textarea
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                                rows={3}
                                value={input}
                                disabled={loading}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="พิมพ์คำถามของคุณ..."
                            />
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="text-xs text-slate-500">
                                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                                    <span className="mx-1">ส่ง</span>
                                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">Shift+Enter</kbd>
                                    <span className="ml-1">บรรทัดใหม่</span>
                                </div>
                                <button
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner />
                                            กำลังส่ง...
                                        </>
                                    ) : (
                                        <>
                                            <span>ส่งข้อความ</span>
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
