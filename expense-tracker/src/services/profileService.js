import { authorizedFetch } from "./api";

export async function getUserProfile() {
  return authorizedFetch("/auth/user/profile", {
    method: "GET",
  });
}

export async function updateUserProfile(profileData) {
  return authorizedFetch("/auth/user/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}
