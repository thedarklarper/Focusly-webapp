export type LocalAccount = { id: string; handle: string; display: string };

// The three demo accounts. All share the password "123456".
export const LOCAL_PASSWORD = "123456";

export const LOCAL_ACCOUNTS: LocalAccount[] = [
  { id: "chris", handle: "chris", display: "Chris" },
  { id: "steve", handle: "steve", display: "Steve" },
  { id: "user", handle: "user", display: "User" },
];

const SESSION_KEY = "focusly:session:v1";

export function findAccount(handle: string): LocalAccount | undefined {
  const h = handle.trim().toLowerCase();
  return LOCAL_ACCOUNTS.find((a) => a.handle === h);
}

export function getSessionAccount(): LocalAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return findAccount(raw) || null;
  } catch {
    return null;
  }
}

export function setSessionAccount(handle: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!handle) window.localStorage.removeItem(SESSION_KEY);
    else window.localStorage.setItem(SESSION_KEY, handle);
  } catch {
    /* ignore */
  }
}
