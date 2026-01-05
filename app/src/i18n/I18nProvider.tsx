"use client";

import { createContext, useMemo } from "react";
import { createTranslator } from "./index";
import type { Messages } from "./index";

type I18nContextValue = {
  locale: string;
  messages: Messages;
  t: (key: string) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
};

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    const t = createTranslator(messages);
    return { locale, messages, t };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
