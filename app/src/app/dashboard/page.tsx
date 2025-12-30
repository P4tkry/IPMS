"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, router, session?.user]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4ef] px-6 text-[#2a241f]">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f1d9bf] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#dfe7c6] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#b9a38c_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 py-20">
        <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
          Dashboard
        </Badge>
        <h1 className="text-3xl font-semibold">Witaj w IPMS</h1>
        <p className="text-sm text-[#6f6255]">
          To Twoj panel. Ponizej znajdziesz dane zalogowanego uzytkownika.
        </p>

        <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-4 p-6 text-sm text-[#5c4f45]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                User
              </span>
              <span className="text-xs text-[#6f6255]">
                {session?.user?.email || "Brak danych"}
              </span>
            </div>
            <div className="grid gap-3 rounded-xl border border-[#eadfd3] bg-[#f8f4ef] p-4 text-xs text-[#6f6255]">
              <div>Id: {session?.user?.id || "-"}</div>
              <div>Imie: {session?.user?.name || "-"}</div>
              <div>Email: {session?.user?.email || "-"}</div>
              <div>Zweryfikowany email: {session?.user?.emailVerified ? "Tak" : "Nie"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
