import { cookies } from "next/headers";
import { createTranslator, defaultLocale, getMessages, isSupportedLocale } from "./index";

export const getServerI18n = async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value ?? null;
  const locale = isSupportedLocale(localeCookie) ? localeCookie : defaultLocale;
  const messages = getMessages(locale);
  const t = createTranslator(messages);

  return { locale, messages, t };
};
