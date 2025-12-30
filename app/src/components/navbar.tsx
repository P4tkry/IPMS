"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session } = authClient.useSession();

  const signOut = async () => {
    await authClient.signOut();
  };

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="fixed left-0 top-0 z-20 w-full px-6 py-4 text-[#2a241f] pointer-events-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-[#e2d6c9] bg-white/80 px-5 py-3 shadow-[0_20px_50px_-35px_rgba(60,40,20,0.5)] backdrop-blur pointer-events-auto">
        <Link
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#8d7b68]"
          href="/"
        >
          <span className="h-2 w-2 rounded-full bg-[#d79b6d]" />
          ipms
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-[#6f6255] hover:text-[#2a241f]" href="/">
            Home
          </Link>
          {session?.user ? (
            <>
              <Link className="text-[#6f6255] hover:text-[#2a241f]" href="/dashboard">
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-9 w-9 border border-[#d7c8b7]">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="bg-[#f8f4ef] text-xs text-[#2a241f]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {session.user.name || session.user.email}
                    <div className="mt-1 text-xs text-muted-foreground">{session.user.email}</div>
                  </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Ustawienia</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>Wyloguj</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <Link
              className="rounded-full border border-[#d7c8b7] px-4 py-2 text-[#2a241f] hover:border-[#2a241f]"
              href="/login"
            >
              Logowanie
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
