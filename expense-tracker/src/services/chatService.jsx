import { getToken } from "./incomeService";
import { BACKEND_BASE } from "./api";

export async function sendChatMessage(message) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/chat/send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Chat failed");
  }
  return await res.json();
}