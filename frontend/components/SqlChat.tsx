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
        <div className="relative isolate overflow-hidden py-12 px-4 lg:px-0">
            <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_10%_10%,rgba(129,140,248,0.18),transparent_28%),radial-gradient(circle_at_90%_8%,rgba(236,72,153,0.16),transparent_32%),radial-gradient(circle_at_50%_82%,rgba(125,211,252,0.14),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[conic-gradient(from_120deg_at_50%_40%,rgba(56,189,248,0.08),rgba(236,72,153,0.05),rgba(248,113,113,0.12),rgba(56,189,248,0.05),rgba(16,185,129,0.08))] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.04),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-0 -z-40 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_12%,transparent_12%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_62%,transparent_62%,transparent)] bg-[length:18px_18px] opacity-5" />

            <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0f1d] via-[#0c1226] to-[#090f1c] shadow-[0_25px_80px_-35px_rgba(56,189,248,0.55)] ring-1 ring-white/10">
                    <div className="absolute inset-px rounded-[22px] border border-white/5 bg-gradient-to-r from-white/5 via-fuchsia-500/10 to-indigo-500/5 opacity-60" />
                    <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-sky-400/25 via-fuchsia-400/15 to-amber-300/25 blur-3xl" />
                    <div className="absolute -left-10 bottom-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent blur-2xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.05),transparent_25%)] opacity-30" />
                    <div className="relative p-8 lg:p-12 flex flex-col gap-10 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100 shadow-inner">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                                    AI Data Pilot
                                </div>
                                <h1 className="text-4xl font-black lg:text-5xl leading-tight">
                                    Next‑Gen SQL Copilot for MSSQL
                                </h1>
                                <p className="text-slate-200 max-w-3xl leading-relaxed">
                                    เชื่อมต่อฐานข้อมูล MSSQL แล้วให้ AI วิเคราะห์ สร้าง SQL และรันผลลัพธ์ได้แบบเรียลไทม์ พร้อมการสนทนาเป็นภาษาไทยที่ดูล้ำทันสมัย
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                    <span className="rounded-full bg-white/10 px-3 py-1">Realtime</span>
                                    <span className="rounded-full bg-white/10 px-3 py-1">Thai + SQL Bilingual</span>
                                    <span className="rounded-full bg-white/10 px-3 py-1">Llama Power</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 self-stretch rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-100 shadow-lg">
                                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-300">
                                    <span>รุ่น</span>
                                    <span className="rounded-full bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/40 to-amber-400/40 px-3 py-1 text-[11px] font-bold text-white shadow-[0_8px_30px_-18px_rgba(236,72,153,0.9)]">
                                        Llama Copilot
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-300">
                                    <span>โหมด</span>
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-emerald-100">Analysis + SQL</span>
                                </div>
                                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-300">
                                    <span>Latency</span>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                                        <span className="text-sm font-semibold text-white">~1.2s</span>
                                    </div>
                                </div>
                                <div className="mt-2 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                <p className="text-xs text-slate-300">
                                    ดีไซน์ใหม่โทน twilight + neon ให้ความรู้สึกเหมือนแดชบอร์ด AI ที่ทันสมัยและพร้อมใช้งานจริง
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner backdrop-blur">
                                <p className="text-xs text-slate-200">สถานะ schema</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                                        <div className="absolute inset-y-0 left-0 w-4/5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500" />
                                    </div>
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                                        Uplink
                                    </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-white">{schemaStatus.label}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner backdrop-blur">
                                <p className="text-xs text-slate-200">พร้อมสำหรับการสนทนา</p>
                                <p className="mt-2 text-lg font-extrabold text-white">AI Console: วิเคราะห์ + สร้าง SQL</p>
                                <p className="text-xs text-slate-300">เบลนด์สี neon + glassmorphism</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner backdrop-blur">
                                <p className="text-xs text-slate-200">เคล็ดลัด</p>
                                <p className="mt-2 text-sm text-slate-100">กด Enter เพื่อส่ง, Shift + Enter เพื่อขึ้นบรรทัดใหม่</p>
                                <p className="text-xs text-slate-300">พิมพ์ "โหลด schema" แล้วไปต่อได้ทันที</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-200">
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100 ring-1 ring-emerald-400/30">Realtime AI</span>
                                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-100 ring-1 ring-indigo-400/30">Twilight CSS</span>
                                <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-fuchsia-100 ring-1 ring-fuchsia-400/30">Neon gradients</span>
                                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-100 ring-1 ring-amber-400/30">Glass UI</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-indigo-900/50 bg-[#0b1122]/80 p-5 shadow-xl backdrop-blur">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-white">1. โหลด Schema จากฐานข้อมูล</h2>
                                <p className="text-sm text-slate-300">ดึงโครงสร้างปัจจุบันจาก MSSQL (ตามค่า env ของ backend)</p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${schemaStatus.tone}`}>
                                {schemaStatus.label}
                            </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-fuchsia-400 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_-12px_rgba(99,102,241,0.8)] transition hover:-translate-y-0.5 hover:from-sky-500 hover:via-fuchsia-500 hover:to-amber-400 hover:shadow-[0_16px_40px_-12px_rgba(244,114,182,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => loadSchema(true)}
                                disabled={schemaLoading}
                            >
                                {schemaLoading ? "กำลังโหลด..." : "Refresh schema"}
                            </button>
                            <button
                                className="rounded-xl border border-slate-700/70 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:bg-slate-800/70"
                                onClick={() => setMessages([])}
                            >
                                ล้างข้อความแชท
                            </button>
                        </div>
                        {schemaError && (
                            <div className="mt-3 rounded-xl border border-red-400/50 bg-red-900/40 px-3 py-2 text-sm text-red-100">
                                {schemaError}
                            </div>
                        )}
                        <div className="mt-4 rounded-2xl border border-indigo-900 bg-[#0c1222]/80 p-3 shadow-inner">
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                                <span>โครงสร้างตาราง</span>
                                <span>{schema ? Object.keys(schema).length : 0} tables</span>
                            </div>
                            <div className="h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gradient-to-b from-slate-900/80 to-slate-900 px-3 py-2 text-sm font-mono text-slate-100 shadow-inner ring-1 ring-white/5">
                                {schema ? (
                                    schemaSummary || "Schema is empty"
                                ) : (
                                    <span className="text-slate-500">ยังไม่โหลด schema จากฐานข้อมูล</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 rounded-3xl border border-indigo-900/60 bg-[#0c1224]/85 p-5 shadow-2xl backdrop-blur">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-white">2. เริ่มสนทนา</h2>
                                    <p className="text-sm text-slate-300">ถามด้วยภาษาคน หรือสั่งให้ช่วยสร้างและรัน SQL</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                    <span className="rounded-full border border-slate-700/70 bg-[#131b2c] px-3 py-1">Enter เพื่อส่ง</span>
                                    <span className="rounded-full border border-slate-700/70 bg-[#131b2c] px-3 py-1">Shift + Enter ขึ้นบรรทัดใหม่</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {suggestionPhrases.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        className="rounded-full border border-indigo-700/60 bg-gradient-to-r from-indigo-900/80 via-slate-900/70 to-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400 hover:from-indigo-800/80 hover:via-slate-900/80 hover:to-fuchsia-900/40 hover:text-white"
                                        onClick={() => setInput(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[320px] space-y-3 rounded-2xl border border-indigo-900 bg-gradient-to-br from-[#0c1220] via-[#0f172a] to-[#0a1020] p-3 shadow-inner ring-1 ring-white/5">
                                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-wide text-slate-200">
                                    <span>Futuristic chat log</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500/30 via-fuchsia-500/40 to-emerald-400/30 px-3 py-1 text-[10px] font-bold text-white">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                        Online
                                    </span>
                                </div>
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-2xl space-y-2 rounded-2xl border px-4 py-3 shadow-lg ring-1 ${
                                                m.role === "user"
                                                    ? "border-fuchsia-400/40 bg-gradient-to-br from-indigo-500/80 via-fuchsia-500/80 to-amber-300/80 text-slate-950 ring-white/10"
                                                    : "border-slate-700/80 bg-slate-900/80 text-slate-50 ring-sky-500/10"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                                                <span className={`h-2 w-2 rounded-full ${m.role === "user" ? "bg-white" : "bg-sky-400"}`} />
                                                {m.role === "user" ? "You" : "Assistant"}
                                            </div>
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                                            {m.sql && (
                                                <pre className="overflow-x-auto rounded-lg bg-slate-900/80 px-3 py-2 text-xs text-slate-100 ring-1 ring-sky-500/30">
                                                    {m.sql}
                                                </pre>
                                            )}
                                            {m.result && (
                                                <pre className="overflow-x-auto rounded-lg bg-slate-100/10 px-3 py-2 text-xs text-emerald-100 ring-1 ring-emerald-500/20">
                                                    {JSON.stringify(m.result, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-indigo-800 bg-[#0c1222]/70 p-6 text-center text-sm text-slate-400">
                                        โหลด schema แล้วลองถามเช่น: "ดูรายการ food_logs 10 แถวแรก" หรือ "สรุปยอด calories วันนี้"
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-900 bg-[#0b1122]/80 p-3 shadow-inner ring-1 ring-white/5">
                                <textarea
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-50 shadow-sm transition focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 disabled:bg-slate-800"
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
                                    placeholder="พิมพ์คำถาม เช่น 'สรุปยอด calories วันนี้' หรือ 'select 10 แถวแรกจาก food_logs'"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-slate-400">รองรับการส่งข้อความหลายบรรทัด กด Enter เพื่อส่งข้อความ</p>
                                    <button
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-fuchsia-500 to-amber-300 px-6 py-2 text-sm font-bold text-slate-950 shadow-[0_12px_30px_-12px_rgba(129,140,248,0.9)] transition hover:-translate-y-0.5 hover:from-sky-500 hover:via-fuchsia-600 hover:to-amber-400 hover:shadow-[0_16px_40px_-12px_rgba(244,114,182,0.95)] disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={handleSend}
                                        disabled={loading}
                                    >
                                        {loading ? "กำลังประมวลผล..." : "Send message"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
