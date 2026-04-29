import { cookies } from "next/headers";

import { DEFAULT_LANG, isAppLang, type AppLang } from "@/lib/i18n/messages";

export async function getServerLang(): Promise<AppLang> {
  const cookieStore = await cookies();
  const value = cookieStore.get("lang")?.value;
  if (value && isAppLang(value)) return value;
  return DEFAULT_LANG;
}
