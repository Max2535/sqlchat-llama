const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function uploadSchema(connectionId: string, ddl: string) {
  const res = await fetch(`${BACKEND_URL}/schema/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId, ddl })
  });
  return res.json();
}

export async function sendChat(connectionId: string, message: string) {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId, message, execute: true })
  });
  return res.json();
}

