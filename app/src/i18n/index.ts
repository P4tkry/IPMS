import pl from "./messages/pl.json";
import en from "./messages/en.json";

export type Locale = "pl" | "en";

export type Messages = Record<string, string | Messages>;

export const defaultLocale: Locale = "pl";

export const isSupportedLocale = (value?: string | null): value is Locale =>
  value === "pl" || value === "en";

export const resolveKey = (messages: Messages, key: string): string | undefined => {
  const parts = key.split(".");
  let current: Messages | string | undefined = messages;
  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Messages)[part];
  }
  return typeof current === "string" ? current : undefined;
};

export const createTranslator =
  (messages: Messages) =>
  (key: string): string =>
    resolveKey(messages, key) ?? key;

const messagesByLocale: Record<Locale, Messages> = {
  pl,
  en,
};

export const getMessages = (locale: Locale): Messages => messagesByLocale[locale];
