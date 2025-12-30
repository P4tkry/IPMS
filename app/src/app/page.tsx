import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4ef] px-6 text-[#2a241f]">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f1d9bf] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#dfe7c6] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#b9a38c_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 py-20">

        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
              Launching in Q1 2026
            </Badge>
            <h1
              className={`${fraunces.className} text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl`}
            >
              Inteligent Project Management Software
            </h1>
            <p className="max-w-xl text-lg text-[#5c4f45]">
              Align strategy, execution, and reporting in one workspace. IPMS keeps every initiative,
              roadmap, and delivery team in lockstep so you can move fast without losing clarity.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button className="h-11 bg-[#2a241f] px-6 text-base text-[#f6efe8] hover:bg-[#3a332c]">
                Request demo
              </Button>
              <Button
                variant="outline"
                className="h-11 border-[#d7c8b7] px-6 text-base text-[#2a241f]"
              >
                View roadmap
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-[#7a6a5c]">
              <span>Unified portfolio views</span>
              <span>AI-driven risk insights</span>
              <span>Real-time exec dashboards</span>
            </div>
          </div>

          <Card className="border-[#e2d6c9] bg-white/70 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                  Live signal
                </p>
                <h2 className="text-2xl font-semibold text-[#2a241f]">Portfolio Pulse</h2>
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-white p-6">
                <div className="flex items-center justify-between text-sm text-[#6f6255]">
                  <span>Program health</span>
                  <span>+12%</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f1e7dc]">
                  <div className="h-full w-3/4 rounded-full bg-[#2a241f]" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-xs text-[#6f6255]">
                  <div>
                    <p className="text-lg font-semibold text-[#2a241f]">38</p>
                    Active initiatives
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2a241f]">92%</p>
                    Delivery on track
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2a241f]">4.7d</p>
                    Avg. risk alert
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f4ef] p-6">
                <p className="text-sm font-semibold text-[#2a241f]">Today</p>
                <p className="text-sm text-[#6f6255]">
                  6 milestones are ahead of plan. 2 need executive attention.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 text-sm text-[#6f6255] md:grid-cols-3">
          <Card className="border-[#eadfd3] bg-white/60">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                Plan
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2a241f]">Strategic alignment</p>
              <p className="mt-2">
                Tie every initiative to objectives with clear ownership and impact tracking.
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#eadfd3] bg-white/60">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                Execute
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2a241f]">Momentum visibility</p>
              <p className="mt-2">
                Surface blockers early with live signals and automated status rollups.
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#eadfd3] bg-white/60">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                Report
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2a241f]">Executive-ready</p>
              <p className="mt-2">
                Build board-ready narratives with dashboards tailored to every stakeholder.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
