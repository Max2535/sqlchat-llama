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
        <div className="w-full max-w-6xl mx-auto py-10 px-4 lg:px-0 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-90" />
                <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="relative p-8 lg:p-12 flex flex-col gap-6 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-wide text-sky-200">SQL Copilot</p>
                            <h1 className="text-3xl font-bold lg:text-4xl">Dynamic SQL Chat (Llama + MSSQL)</h1>
                            <p className="text-slate-200 mt-2 max-w-2xl">
                                โหลด schema จากฐานข้อมูล MSSQL แล้วสนทนาถาม-ตอบเป็นภาษาไทย หรือให้ AI สร้างคำสั่ง SQL และรันผลลัพธ์ให้ทันที
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-start rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-sky-100 ring-1 ring-white/20">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Live database assistant
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-inner">
                            <p className="text-xs text-slate-200">สถานะ schema</p>
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                                <span className="h-2 w-2 rounded-full bg-emerald-300" /> {schemaStatus.label}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-inner">
                            <p className="text-xs text-slate-200">พร้อมสำหรับการสนทนา</p>
                            <p className="mt-2 text-lg font-semibold">วิเคราะห์ข้อมูลและสร้าง SQL อัตโนมัติ</p>
                        </div>
                        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-inner">
                            <p className="text-xs text-slate-200">เคล็ดลัด</p>
                            <p className="mt-2 text-sm text-slate-100">กด Enter เพื่อส่ง, Shift + Enter เพื่อขึ้นบรรทัดใหม่</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">1. โหลด Schema จากฐานข้อมูล</h2>
                            <p className="text-sm text-slate-600">
                                ดึงโครงสร้างปัจจุบันจาก MSSQL (ตามค่า env ของ backend)
                            </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${schemaStatus.tone}`}>
                            {schemaStatus.label}
                        </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => loadSchema(true)}
                            disabled={schemaLoading}
                        >
                            {schemaLoading ? "กำลังโหลด..." : "Refresh schema"}
                        </button>
                        <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            onClick={() => setMessages([])}
                        >
                            ล้างข้อความแชท
                        </button>
                    </div>
                    {schemaError && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {schemaError}
                        </div>
                    )}
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                            <span>โครงสร้างตาราง</span>
                            <span>{schema ? Object.keys(schema).length : 0} tables</span>
                        </div>
                        <div className="h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm font-mono text-slate-800 shadow-inner">
                            {schema ? (
                                schemaSummary || "Schema is empty"
                            ) : (
                                <span className="text-slate-400">ยังไม่โหลด schema จากฐานข้อมูล</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">2. เริ่มสนทนา</h2>
                                <p className="text-sm text-slate-600">ถามด้วยภาษาคน หรือสั่งให้ช่วยสร้างและรัน SQL</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-1">Enter เพื่อส่ง</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1">Shift + Enter ขึ้นบรรทัดใหม่</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {suggestionPhrases.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                                    onClick={() => setInput(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[320px] space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-inner">
                            {messages.map((m, idx) => (
                                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-2xl space-y-2 rounded-2xl border px-4 py-3 shadow-sm ${
                                            m.role === "user"
                                                ? "border-sky-100 bg-gradient-to-br from-sky-600 to-sky-500 text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-900"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                                            <span className={`h-2 w-2 rounded-full ${m.role === "user" ? "bg-white" : "bg-sky-600"}`} />
                                            {m.role === "user" ? "You" : "Assistant"}
                                        </div>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                                        {m.sql && (
                                            <pre className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
                                                {m.sql}
                                            </pre>
                                        )}
                                        {m.result && (
                                            <pre className="overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800">
                                                {JSON.stringify(m.result, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                                    โหลด schema แล้วลองถามเช่น: "ดูรายการ food_logs 10 แถวแรก" หรือ "สรุปยอด calories วันนี้"
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-inner">
                            <textarea
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100"
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
                                <p className="text-xs text-slate-500">รองรับการส่งข้อความหลายบรรทัด กด Enter เพื่อส่งข้อความ</p>
                                <button
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-700 hover:to-sky-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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
    );
}
