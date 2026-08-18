export interface Me {
  email: string | null;
  name: string | null;
  picture: string | null;
  role: "admin" | "volunteer" | null;
}

export const session = {
  get: (): Promise<Me> => fetch("/app-api/me").then((r) => r.json()),
};

export function signIn() {
  window.location.href = "/auth/login";
}

export async function signOut() {
  await fetch("/auth/logout", { method: "POST" });
  window.location.href = "/";
}
