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
    "สรุป schema ให้หน่อย",
    "แสดง 10 แถวล่าสุดจาก food_logs",
    "หาค่าเฉลี่ย calories ต่อวัน",
    "ช่วยแนะนำ insight จากฐานข้อมูล"
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
        <div className="relative min-h-screen bg-[#f5f7fb] text-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_60%_80%,rgba(94,234,212,0.12),transparent_35%)]" />
            <div className="relative z-10 flex min-h-screen">
                <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-[#0f172a] text-slate-100 shadow-xl lg:flex">
                    <div className="px-5 pb-6 pt-5">
                        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-semibold text-slate-900">
                                OI
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-300">Open SQL</p>
                                <p className="text-sm font-semibold text-white">Copilot</p>
                            </div>
                        </div>
                        <button
                            className="mt-4 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                            onClick={() => {
                                setMessages([]);
                                setInput("");
                            }}
                        >
                            + New conversation
                        </button>
                    </div>
                    <div className="flex-1 space-y-2 px-4 text-sm text-slate-200">
                        {["Models", "Prompts", "Datasets", "Workspace"].map((item) => (
                            <div
                                key={item}
                                className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/5"
                            >
                                <span>{item}</span>
                                <span className="h-2 w-2 rounded-full bg-white/40" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto space-y-2 px-4 pb-6 text-xs text-slate-400">
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                            <p className="font-semibold text-white">SQL Chat</p>
                            <p className="text-[11px] leading-snug">พูดคุย สร้าง และรันคำสั่ง SQL ด้วย UI ที่คลีน</p>
                        </div>
                        <div className="rounded-xl bg-white/5 px-3 py-2">
                            <p className="font-semibold text-white">พร้อมใช้งาน</p>
                            <p className="text-[11px] leading-snug text-emerald-100">Online • Live schema</p>
                        </div>
                    </div>
                </aside>

                <main className="flex-1">
                    <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-4 backdrop-blur md:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-lg font-semibold text-white shadow-lg">
                                OI
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Open SQL Copilot</p>
                                <p className="text-lg font-semibold text-slate-900">สวัสดี! ให้ช่วยอะไรดี</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold">AI Ready</span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 font-semibold">SQL + Analysis</span>
                        </div>
                    </header>

                    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-8 md:px-8">
                        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                            <div className="rounded-2xl bg-white/90 p-6 shadow-lg ring-1 ring-slate-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">SQL Chat</p>
                                        <p className="text-2xl font-semibold text-slate-900">How can I help you today?</p>
                                        <p className="text-sm text-slate-500">ถามคำถาม สร้างหรือปรับแก้ SQL ให้ตรงใจ</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg">SQL</div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                                    {suggestionPhrases.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-semibold transition hover:border-slate-300 hover:bg-white"
                                            onClick={() => setInput(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl bg-white/90 p-5 shadow-lg ring-1 ring-slate-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Database schema</p>
                                        <p className="text-xs text-slate-500">โหลดเพื่อให้ AI เข้าใจโครงสร้าง</p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${schemaStatus.tone}`}>
                                        {schemaStatus.label}
                                    </span>
                                </div>
                                <div className="flex gap-2 text-sm">
                                    <button
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                                        onClick={() => loadSchema(true)}
                                        disabled={schemaLoading}
                                    >
                                        {schemaLoading ? "กำลังโหลด..." : "Refresh schema"}
                                    </button>
                                    <button
                                        className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                                        onClick={() => setMessages([])}
                                    >
                                        ล้างแชท
                                    </button>
                                </div>
                                {schemaError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        {schemaError}
                                    </div>
                                )}
                                <div className="h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                    {schema ? schemaSummary || "Schema is empty" : <span className="text-slate-400">ยังไม่โหลด schema จากฐานข้อมูล</span>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-slate-100">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Chat</p>
                                    <p className="text-xs text-slate-500">คุยกับผู้ช่วยและดูผลลัพธ์ SQL</p>
                                </div>
                                <div className="flex gap-2 text-xs text-slate-500">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Enter เพื่อส่ง</span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Shift + Enter ขึ้นบรรทัดใหม่</span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
                                            <span className="text-lg">💬</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">เริ่มสนทนาด้วยคำถามแรกของคุณ</p>
                                        <p className="text-xs text-slate-500">ตัวอย่าง: "ดูรายการ food_logs 10 แถวแรก" หรือ "สรุปยอด calories วันนี้"</p>
                                    </div>
                                )}

                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-3xl space-y-2 rounded-2xl border px-4 py-3 shadow-sm ${
                                                m.role === "user"
                                                    ? "border-indigo-100 bg-indigo-50 text-slate-900"
                                                    : "border-slate-200 bg-white text-slate-900"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                                <span className={`h-2 w-2 rounded-full ${m.role === "user" ? "bg-indigo-500" : "bg-emerald-500"}`} />
                                                {m.role === "user" ? "You" : "Assistant"}
                                            </div>
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                                            {m.sql && (
                                                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                                                    {m.sql}
                                                </pre>
                                            )}
                                            {m.result && (
                                                <pre className="overflow-x-auto rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                                    {JSON.stringify(m.result, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
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
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                    <p>รองรับหลายบรรทัด ส่งด้วย Enter</p>
                                    <div className="flex gap-2">
                                        <button
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
                                            onClick={() => setInput("โหลด schema แล้วสรุปตารางหลักให้หน่อย")}
                                            disabled={loading}
                                        >
                                            เติมข้อความอัตโนมัติ
                                        </button>
                                        <button
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:from-indigo-600 hover:to-sky-600 disabled:opacity-60"
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
                </main>
            </div>
        </div>
    );
}
