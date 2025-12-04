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

export default function SqlChat() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [schema, setSchema] = useState<Record<string, { name: string; type: string }[]> | null>(null);
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [schemaError, setSchemaError] = useState<string | null>(null);

    const schemaSummary = useMemo(() => {
        if (!schema) return "";

        return Object.entries(schema)
            .map(([table, columns]) => `${table}: ${columns.map((col) => `${col.name} (${col.type})`).join(", ")}`)
            .join("\n");
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
        <div className="w-full max-w-7xl mx-auto py-8 px-4 lg:px-6 flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Enhanced Hero Header */}
            <div className="relative overflow-hidden rounded-3xl border border-violet-200/50 bg-white shadow-2xl transition-all duration-500 hover:shadow-violet-200/50">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-pink-400/30 blur-3xl animate-pulse" />
                <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-cyan-400/30 blur-3xl animate-pulse delay-700" />

                <div className="relative p-8 lg:p-12 flex flex-col gap-6 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-100 border border-white/30">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                AI SQL Copilot
                            </div>
                            <h1 className="text-4xl font-black lg:text-5xl bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent drop-shadow-lg">
                                Dynamic SQL Chat
                            </h1>
                            <p className="text-lg text-violet-100 font-medium">Powered by Llama + MSSQL</p>
                            <p className="text-slate-100 mt-3 max-w-2xl leading-relaxed">
                                โหลด schema จากฐานข้อมูล MSSQL แล้วสนทนาถาม-ตอบเป็นภาษาไทย หรือให้ AI สร้างคำสั่ง SQL และรันผลลัพธ์ให้ทันที
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-start rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 backdrop-blur-md px-5 py-3 text-sm font-semibold text-white ring-2 ring-white/30 shadow-lg">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                            </span>
                            Live Database
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="group rounded-2xl border border-white/30 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm px-5 py-4 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/20">
                            <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide">สถานะ Schema</p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold shadow-inner">
                                <span className={`h-2.5 w-2.5 rounded-full ${schema ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                {schemaStatus.label}
                            </div>
                        </div>
                        <div className="group rounded-2xl border border-white/30 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm px-5 py-4 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/20">
                            <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide">ความสามารถ</p>
                            <p className="mt-3 text-base font-bold leading-snug">วิเคราะห์ข้อมูลและสร้าง SQL อัตโนมัติ</p>
                        </div>
                        <div className="group rounded-2xl border border-white/30 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm px-5 py-4 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/20">
                            <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide">เคล็ดลับ</p>
                            <p className="mt-3 text-sm font-semibold leading-snug">
                                <kbd className="rounded bg-white/20 px-2 py-0.5 text-xs">Enter</kbd> ส่ง •
                                <kbd className="ml-1 rounded bg-white/20 px-2 py-0.5 text-xs">Shift+Enter</kbd> บรรทัดใหม่
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Schema Panel - Enhanced */}
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/30 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-sm shadow-lg">
                                    1
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">โหลด Schema</h2>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                ดึงโครงสร้างฐานข้อมูลจาก MSSQL
                            </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${schemaStatus.tone} shadow-sm`}>
                            {schemaStatus.label}
                        </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                        <button
                            className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                            onClick={() => loadSchema(true)}
                            disabled={schemaLoading}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {schemaLoading ? (
                                    <>
                                        <Spinner />
                                        กำลังโหลด...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 -z-0 bg-gradient-to-r from-purple-600 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </button>
                        <button
                            className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                            onClick={() => setMessages([])}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {schemaError && (
                        <div className="mt-4 animate-in slide-in-from-top-2 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 px-4 py-3 text-sm font-semibold text-red-800 shadow-md">
                            <div className="flex items-start gap-2">
                                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{schemaError}</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-inner">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">โครงสร้างตาราง</span>
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                                {schema ? Object.keys(schema).length : 0} tables
                            </span>
                        </div>
                        <div className="h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-800 shadow-sm">
                            {schema ? (
                                schemaSummary || "Schema is empty"
                            ) : (
                                <span className="flex items-center justify-center h-full text-slate-400 text-center">
                                    ยังไม่ได้โหลด schema จากฐานข้อมูล
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Interface - Enhanced */}
                <div className="lg:col-span-2 rounded-2xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-sm shadow-lg">
                                    2
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">เริ่มสนทนา</h2>
                                    <p className="text-sm text-slate-600">ถามด้วยภาษาคน หรือสั่งให้สร้าง SQL</p>
                                </div>
                            </div>
                        </div>

                        {/* Suggestion Pills */}
                        <div className="flex flex-wrap gap-2">
                            {suggestionPhrases.map((suggestion, idx) => (
                                <button
                                    key={suggestion}
                                    className="group relative overflow-hidden rounded-full border-2 border-indigo-200 bg-gradient-to-r from-white to-indigo-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-105 hover:border-indigo-400 hover:shadow-md"
                                    onClick={() => setInput(suggestion)}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <svg className="h-3 w-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                        {suggestion}
                                    </span>
                                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-indigo-100 to-blue-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>

                        {/* Messages Area - Enhanced */}
                        <div className="min-h-[380px] max-h-[500px] space-y-4 overflow-y-auto rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/50 to-white p-4 shadow-inner">
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={`flex animate-in slide-in-from-bottom-4 duration-500 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div
                                        className={`group max-w-[85%] space-y-3 rounded-2xl border-2 px-5 py-4 shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                                            m.role === "user"
                                                ? "border-blue-200 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-blue-200/50"
                                                : "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 text-slate-900 shadow-emerald-200/30"
                                        }`}
                                    >
                                        {/* Message Header */}
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                                m.role === "user"
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                                            } shadow-md`}>
                                                {m.role === "user" ? (
                                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={m.role === "user" ? "text-white/90" : "text-slate-700"}>
                                                {m.role === "user" ? "คุณ" : "AI Assistant"}
                                            </span>
                                        </div>

                                        {/* Message Text */}
                                        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                            m.role === "user" ? "text-white" : "text-slate-800"
                                        }`}>
                                            {m.text}
                                        </div>

                                        {/* SQL Code Block */}
                                        {m.sql && (
                                            <div className="relative">
                                                <div className="absolute right-2 top-2 rounded bg-slate-700 px-2 py-1 text-[10px] font-bold uppercase text-slate-300">
                                                    SQL
                                                </div>
                                                <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3 text-xs text-emerald-300 shadow-inner">
                                                    {m.sql}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Result Block */}
                                        {m.result && (
                                            <div className="relative">
                                                <div className="absolute right-2 top-2 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
                                                    Result
                                                </div>
                                                <pre className="overflow-x-auto rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-3 text-xs text-slate-800 shadow-inner">
                                                    {JSON.stringify(m.result, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {messages.length === 0 && (
                                <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-8 text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                                        <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">เริ่มสนทนากับ AI Assistant</p>
                                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                                        โหลด schema แล้วลองถามเช่น: "ดูรายการ food_logs 10 แถวแรก" หรือ "สรุปยอด calories วันนี้"
                                    </p>
                                </div>
                            )}

                            {/* Loading Indicator */}
                            {loading && (
                                <div className="flex justify-start animate-in slide-in-from-bottom-4">
                                    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50 px-5 py-4 shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <Spinner />
                                            <span className="text-sm font-semibold text-slate-700">กำลังประมวลผล...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area - Enhanced */}
                        <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-slate-50 to-indigo-50/50 p-4 shadow-lg">
                            <textarea
                                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                                placeholder="พิมพ์คำถาม เช่น 'สรุปยอด calories วันนี้' หรือ 'select 10 แถวแรกจาก food_logs' ..."
                            />
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">
                                        <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold">Enter</kbd> ส่ง •
                                        <kbd className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold">Shift+Enter</kbd> บรรทัดใหม่
                                    </span>
                                </div>
                                <button
                                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading ? (
                                            <>
                                                <Spinner />
                                                กำลังประมวลผล...
                                            </>
                                        ) : (
                                            <>
                                                <span>ส่งข้อความ</span>
                                                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
