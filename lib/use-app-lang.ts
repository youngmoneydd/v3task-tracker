"use client";

import { useEffect, useMemo, useState } from "react";

import { DEFAULT_LANG, isAppLang, translate, type AppLang, type MessageKey } from "@/lib/i18n/messages";

export function useAppLang() {
  const [lang, setLangState] = useState<AppLang>(DEFAULT_LANG);

  useEffect(() => {
    const fromStorage = window.localStorage.getItem("lang");
    if (fromStorage && isAppLang(fromStorage)) {
      setLangState(fromStorage);
      document.documentElement.lang = fromStorage;
    }
  }, []);

  const setLang = (next: AppLang) => {
    setLangState(next);
    window.localStorage.setItem("lang", next);
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
  };

  const t = useMemo(() => {
    return (key: MessageKey) => translate(lang, key);
  }, [lang]);

  return { lang, setLang, t };
}
