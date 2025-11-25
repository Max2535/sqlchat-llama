const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function refreshSchema() {
  const res = await fetch(`${BACKEND_URL}/schema/refresh`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchSchema() {
  const res = await fetch(`${BACKEND_URL}/schema`);
  return res.json();
}

export async function sendChat(message: string) {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, execute: true })
  });
  return res.json();
}

