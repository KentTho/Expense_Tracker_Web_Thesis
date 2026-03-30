import { authorizedFetch } from "./api";

export async function sendChatMessage(message, history = []) {
  return authorizedFetch("/chat/send", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}
