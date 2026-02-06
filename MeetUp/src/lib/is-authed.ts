export async function isAuthed(): Promise<boolean> {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("session");

  return Boolean(token);
}
