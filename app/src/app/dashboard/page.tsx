"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/useI18n";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, router, session?.user]);

  return (
    <div className="relative min-h-screen px-6 text-[#2a241f]">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 py-20">
        <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
          {t("dashboard.badge")}
        </Badge>
        <h1 className="text-3xl font-semibold">{t("dashboard.title")}</h1>
        <p className="text-sm text-[#6f6255]">{t("dashboard.subtitle")}</p>

        <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-4 p-6 text-sm text-[#5c4f45]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("dashboard.userLabel")}
              </span>
              <span className="text-xs text-[#6f6255]">
                {session?.user?.email || t("common.noData")}
              </span>
            </div>
            <div className="grid gap-3 rounded-xl border border-[#eadfd3] bg-[#f8f4ef] p-4 text-xs text-[#6f6255]">
              <div>{t("dashboard.id")}: {session?.user?.id || "-"}</div>
              <div>{t("dashboard.name")}: {session?.user?.name || "-"}</div>
              <div>{t("dashboard.email")}: {session?.user?.email || "-"}</div>
              <div>
                {t("dashboard.emailVerified")}:{" "}
                {session?.user?.emailVerified ? t("common.yes") : t("common.no")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
