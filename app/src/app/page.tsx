import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerI18n } from "@/i18n/server";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default async function Home() {
  const { t } = await getServerI18n();

  return (
    <div className="relative min-h-screen px-6 text-[#2a241f]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
              {t("home.badge")}
            </Badge>
            <h1
              className={`${fraunces.className} text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl`}
            >
              {t("home.title")}
            </h1>
            <p className="max-w-xl text-lg text-[#5c4f45]">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button className="h-11 bg-[#2a241f] px-6 text-base text-[#f6efe8] hover:bg-[#3a332c]">
                {t("home.primaryCta")}
              </Button>
              <Button
                variant="outline"
                className="h-11 border-[#d7c8b7] px-6 text-base text-[#2a241f]"
              >
                {t("home.secondaryCta")}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-[#7a6a5c]">
              <span>{t("home.highlights.portfolio")}</span>
              <span>{t("home.highlights.risk")}</span>
              <span>{t("home.highlights.dashboards")}</span>
            </div>
          </div>

          <Card className="border-[#e2d6c9] bg-white/70 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                  {t("home.signal.label")}
                </p>
                <h2 className="text-2xl font-semibold text-[#2a241f]">
                  {t("home.signal.title")}
                </h2>
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-white p-6">
                <div className="flex items-center justify-between text-sm text-[#6f6255]">
                  <span>{t("home.signal.programHealth")}</span>
                  <span>{t("home.signal.programChange")}</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f1e7dc]">
                  <div className="h-full w-3/4 rounded-full bg-[#2a241f]" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-xs text-[#6f6255]">
                  <div>
                    <p className="text-lg font-semibold text-[#2a241f]">
                      {t("home.signal.activeValue")}
                    </p>
                    {t("home.signal.activeLabel")}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2a241f]">
                      {t("home.signal.deliveryValue")}
                    </p>
                    {t("home.signal.deliveryLabel")}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2a241f]">
                      {t("home.signal.riskValue")}
                    </p>
                    {t("home.signal.riskLabel")}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f4ef] p-6">
                <p className="text-sm font-semibold text-[#2a241f]">{t("home.today.title")}</p>
                <p className="text-sm text-[#6f6255]">{t("home.today.summary")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 text-sm text-[#6f6255] md:grid-cols-3">
          <Card className="border-[#eadfd3] bg-white/60">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("home.sections.plan.label")}
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2a241f]">
                {t("home.sections.plan.title")}
              </p>
              <p className="mt-2">{t("home.sections.plan.body")}</p>
            </CardContent>
          </Card>
          <Card className="border-[#eadfd3] bg-white/60">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("home.sections.execute.label")}
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2a241f]">
                {t("home.sections.execute.title")}
              </p>
              <p className="mt-2">{t("home.sections.execute.body")}</p>
            </CardContent>
          </Card>
          <Card className="border-[#eadfd3] bg-white/60">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("home.sections.report.label")}
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2a241f]">
                {t("home.sections.report.title")}
              </p>
              <p className="mt-2">{t("home.sections.report.body")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
