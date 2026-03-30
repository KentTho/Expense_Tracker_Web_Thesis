import { authorizedFetch } from "./api";

export async function updateSecuritySettings(settings) {
  return authorizedFetch("/security/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function getSecuritySettings() {
  return authorizedFetch("/security/settings", {
    method: "GET",
  });
}

export async function start2FA() {
  return authorizedFetch("/security/2fa/enable-start", {
    method: "POST",
  });
}

export async function verify2FA(codeOrPayload) {
  const code = typeof codeOrPayload === "string" ? codeOrPayload : codeOrPayload?.code;

  return authorizedFetch("/security/2fa/enable-verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
