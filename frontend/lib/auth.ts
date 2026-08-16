export function saveToken(token: string) {
  localStorage.setItem("fitlife_token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fitlife_token");
}

export function removeToken() {
  localStorage.removeItem("fitlife_token");
}

export function isLoggedIn() {
  return !!getToken();
}