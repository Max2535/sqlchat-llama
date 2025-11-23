import axios from "axios";
import { config } from "../config";

export async function llamaChat(messages: { role: string; content: string }[]) {
  const res = await axios.post(`${config.ollama.baseUrl}/v1/chat/completions`, {
    model: config.ollama.model,
    messages,
    stream: false
  });

  const content = res.data.choices[0].message.content;
  return content;
}

