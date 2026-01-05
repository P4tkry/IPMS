"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Fraunces } from "next/font/google";
import { useI18n } from "@/i18n/useI18n";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const { t } = useI18n();
  const [canViewUsers, setCanViewUsers] = useState(false);
  const pathname = usePathname();
  const isAccount = pathname.startsWith("/settings/account");
  const isUsers = pathname.startsWith("/settings/users");
  const showUsersTab = canViewUsers;

  useEffect(() => {
    if (!session?.user) {
      setCanViewUsers(false);
      return;
    }
    const load = async () => {
      try {
        const response = await fetch("/api/settings");
        const payload = await response.json();
        if (!response.ok) {
          setCanViewUsers(false);
          return;
        }
        const permissions = payload?.user?.permissions || [];
        const allowed =
          permissions.includes("CREATE_USERS") ||
          permissions.includes("UPDATE_USERS") ||
          permissions.includes("REMOVE_USERS");
        setCanViewUsers(allowed);
      } catch {
        setCanViewUsers(false);
      }
    };
    load();
  }, [session?.user]);

  return (
    <div className="relative min-h-screen px-6 text-[#2a241f]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-6">
        <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
          {t("settings.badge")}
        </Badge>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className={`${fraunces.className} text-3xl font-semibold`}>
              {t("settings.title")}
            </h1>
            <p className="mt-2 text-sm text-[#6f6255]">{t("settings.subtitle")}</p>
          </div>
          <div className="rounded-full border border-[#eadfd3] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68] shadow-sm">
            {t("settings.workspace")}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-[#e2d6c9] bg-white/70 shadow-[0_20px_50px_-35px_rgba(60,40,20,0.45)] backdrop-blur">
              <CardContent className="space-y-5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                  {t("settings.sections")}
                </p>
                <nav className="space-y-2 text-sm text-[#5c4f45]">
                  <Link
                    className={`flex items-center justify-between rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:border-[#2a241f] hover:shadow-md ${
                      isAccount
                        ? "border-[#2a241f] bg-[#2a241f] text-[#f6efe8]"
                        : "border-[#e2d6c9] bg-white text-[#2a241f]"
                    }`}
                    href="/settings/account"
                  >
                    {t("settings.accountTab")}
                    <span className="text-xs text-[#8d7b68]">01</span>
                  </Link>
                  {showUsersTab ? (
                    <Link
                      className={`flex items-center justify-between rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:border-[#2a241f] hover:shadow-md ${
                        isUsers
                          ? "border-[#2a241f] bg-[#2a241f] text-[#f6efe8]"
                          : "border-[#e2d6c9] bg-white text-[#2a241f]"
                      }`}
                      href="/settings/users"
                    >
                      {t("settings.usersTab")}
                      <span className="text-xs text-[#8d7b68]">02</span>
                    </Link>
                  ) : null}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {children}
        </div>
      </div>
    </div>
  );
}
