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
        <div className="relative isolate overflow-hidden py-10 px-4 lg:px-0">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(129,140,248,0.15),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(248,113,113,0.12),transparent_32%),radial-gradient(circle_at_50%_75%,rgba(236,72,153,0.1),transparent_26%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-6 -z-10 h-72 bg-[radial-gradient(circle_at_40%_10%,rgba(251,191,36,0.08),transparent_38%),radial-gradient(circle_at_70%_5%,rgba(56,189,248,0.1),transparent_40%)] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_12%,transparent_12%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_62%,transparent_62%,transparent)] bg-[length:18px_18px] opacity-10" />

            <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
                <div className="relative overflow-hidden rounded-3xl border border-fuchsia-100/30 bg-gradient-to-br from-[#0c1224] via-[#0f172a] to-[#111827] shadow-2xl ring-1 ring-fuchsia-500/20">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_18%,transparent_18%,transparent_48%,rgba(255,255,255,0.05)_48%,rgba(255,255,255,0.05)_68%,transparent_68%,transparent)] bg-[length:18px_18px] opacity-10" />
                    <div className="absolute right-6 top-6 h-32 w-32 rounded-full bg-gradient-to-br from-sky-400/25 via-fuchsia-400/25 to-amber-300/25 blur-3xl" />
                    <div className="absolute left-8 bottom-6 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400/20 to-transparent blur-2xl" />
                    <div className="relative p-8 lg:p-12 flex flex-col gap-8 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="space-y-2">
                                <p className="text-sm uppercase tracking-[0.3em] text-sky-200">SQL Copilot</p>
                                <h1 className="text-4xl font-black lg:text-5xl">Dynamic SQL Chat (Llama + MSSQL)</h1>
                                <p className="text-slate-200 max-w-3xl leading-relaxed">
                                    โหลด schema จากฐานข้อมูล MSSQL แล้วสนทนาถาม-ตอบเป็นภาษาไทย หรือให้ AI สร้างคำสั่ง SQL และรันผลลัพธ์ให้ทันที
                                </p>
                            </div>
                            <div className="flex items-center gap-3 self-start rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-sky-100 ring-1 ring-white/20 shadow-lg">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                                Live database assistant
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-inner backdrop-blur">
                                <p className="text-xs text-slate-200">สถานะ schema</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                                        <div className="absolute inset-y-0 left-0 w-4/5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500" />
                                    </div>
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                                        Power
                                    </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-white">{schemaStatus.label}</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-inner backdrop-blur">
                                <p className="text-xs text-slate-200">พร้อมสำหรับการสนทนา</p>
                                <p className="mt-2 text-lg font-extrabold text-white">โหมดล่ำๆ: วิเคราะห์ + สร้าง SQL อัตโนมัติ</p>
                                <p className="text-xs text-slate-300">โทนเข้ม น้ำหนักตัวหนังสือจัดเต็ม</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-inner backdrop-blur">
                                <p className="text-xs text-slate-200">เคล็ดลัด</p>
                                <p className="mt-2 text-sm text-slate-100">กด Enter เพื่อส่ง, Shift + Enter เพื่อขึ้นบรรทัดใหม่</p>
                                <p className="text-xs text-slate-300">พิมพ์ "โหลด schema" แล้วไปต่อได้ทันที</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-200">
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100 ring-1 ring-emerald-400/30">Turbo ready</span>
                                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-100 ring-1 ring-indigo-400/30">Twilight CSS</span>
                                <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-fuchsia-100 ring-1 ring-fuchsia-400/30">Bold gradients</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-indigo-900/60 bg-[#0f1324]/80 p-5 shadow-xl backdrop-blur">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-white">1. โหลด Schema จากฐานข้อมูล</h2>
                                <p className="text-sm text-slate-300">
                                    ดึงโครงสร้างปัจจุบันจาก MSSQL (ตามค่า env ของ backend)
                                </p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${schemaStatus.tone}`}>
                                {schemaStatus.label}
                            </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_-12px_rgba(99,102,241,0.8)] transition hover:-translate-y-0.5 hover:from-indigo-500 hover:via-fuchsia-500 hover:to-amber-400 hover:shadow-[0_16px_40px_-12px_rgba(244,114,182,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => loadSchema(true)}
                                disabled={schemaLoading}
                            >
                                {schemaLoading ? "กำลังโหลด..." : "Refresh schema"}
                            </button>
                            <button
                                className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
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
                        <div className="mt-4 rounded-xl border border-indigo-900 bg-[#0c1222]/80 p-3 shadow-inner">
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                                <span>โครงสร้างตาราง</span>
                                <span>{schema ? Object.keys(schema).length : 0} tables</span>
                            </div>
                            <div className="h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 shadow-inner">
                                {schema ? (
                                    schemaSummary || "Schema is empty"
                                ) : (
                                    <span className="text-slate-500">ยังไม่โหลด schema จากฐานข้อมูล</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 rounded-2xl border border-indigo-900/60 bg-[#0f1324]/80 p-5 shadow-xl backdrop-blur">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-white">2. เริ่มสนทนา</h2>
                                    <p className="text-sm text-slate-300">ถามด้วยภาษาคน หรือสั่งให้ช่วยสร้างและรัน SQL</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                    <span className="rounded-full bg-slate-800 px-3 py-1">Enter เพื่อส่ง</span>
                                    <span className="rounded-full bg-slate-800 px-3 py-1">Shift + Enter ขึ้นบรรทัดใหม่</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {suggestionPhrases.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        className="rounded-full border border-indigo-800/70 bg-[#131b2c] px-4 py-2 text-xs font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400 hover:bg-[#1b2540] hover:text-white"
                                        onClick={() => setInput(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[320px] space-y-3 rounded-xl border border-indigo-900 bg-gradient-to-br from-[#0f1224] via-[#0f172a] to-[#0b1222] p-3 shadow-inner">
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-2xl space-y-2 rounded-2xl border px-4 py-3 shadow-lg ${
                                                m.role === "user"
                                                    ? "border-fuchsia-400/40 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-amber-300 text-slate-950"
                                                    : "border-slate-700 bg-slate-800 text-slate-50"
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

                            <div className="flex flex-col gap-3 rounded-xl border border-indigo-900 bg-[#0c1222]/80 p-3 shadow-inner">
                                <textarea
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 shadow-sm transition focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 disabled:bg-slate-800"
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
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-amber-300 px-6 py-2 text-sm font-bold text-slate-950 shadow-[0_12px_30px_-12px_rgba(129,140,248,0.9)] transition hover:-translate-y-0.5 hover:from-indigo-500 hover:via-fuchsia-600 hover:to-amber-400 hover:shadow-[0_16px_40px_-12px_rgba(244,114,182,0.95)] disabled:cursor-not-allowed disabled:opacity-60"
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
