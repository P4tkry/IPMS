import Image from "next/image";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NotificationItem = {
  id: string;
  type: "project_invite";
  createdAt: Date;
  projectId: string;
  projectName: string | null;
  projectTradeName: string | null;
  invitedBy?: { id: string; name: string | null; email: string | null; image: string | null };
};

const getNotifications = async (userId: string): Promise<NotificationItem[]> => {
  const invites = await prisma.projectInvite.findMany({
    where: { invitedUserId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      project: { select: { id: true, name: true, tradeName: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return invites.map((invite) => ({
    id: invite.id,
    type: "project_invite",
    createdAt: invite.createdAt,
    projectId: invite.project?.id ?? "",
    projectName: invite.project?.name ?? null,
    projectTradeName: invite.project?.tradeName ?? null,
    invitedBy: invite.invitedBy || undefined,
  }));
};

const respondToInvite = async (inviteId: string, decision: "accept" | "decline") => {
  "use server";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const session = await auth.api.getSession({ headers: { cookie: cookieHeader } });
  if (!session?.user) {
    redirect("/login");
  }

  const invite = await prisma.projectInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, status: true, projectId: true, invitedUserId: true },
  });

  if (!invite || invite.invitedUserId !== session.user.id) {
    return;
  }

  if (invite.status !== "PENDING") {
    return;
  }

  if (decision === "accept") {
    await prisma.$transaction([
      prisma.projectInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" },
      }),
      prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: invite.projectId, userId: session.user.id } },
        update: {},
        create: { projectId: invite.projectId, userId: session.user.id },
      }),
    ]);
  } else {
    await prisma.projectInvite.update({
      where: { id: inviteId },
      data: { status: "DECLINED" },
    });
  }

  revalidatePath("/notifications");
};

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const session = await auth.api.getSession({
    headers: { cookie: cookieHeader },
  });
  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await getNotifications(session.user.id);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">Powiadomienia</p>
            <h1 className="text-2xl font-semibold text-[#1f1b16]">Twoje powiadomienia</h1>
            <p className="text-sm text-[#6f6255]">Lista najnowszych zaproszeń i innych zdarzeń.</p>
          </div>
          <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
            {notifications.length}
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfd3] bg-[#fcfaf7] px-4 py-5 text-sm text-[#6f6255]">
            Brak powiadomień.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] px-4 py-3 text-sm text-[#2a241f] shadow-[0_14px_35px_-20px_rgba(30,20,10,0.35)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#eadfd3] bg-[#f8f4ef] text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6255]">
                    {item.invitedBy?.image ? (
                      <Image
                        src={item.invitedBy.image}
                        alt={item.invitedBy.name || item.invitedBy.email || "user"}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span>
                        {(item.invitedBy?.name || item.invitedBy?.email || "??")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1f1b16]">
                      Zaproszenie do projektu {item.projectTradeName || item.projectName || "(bez nazwy)"}
                    </p>
                    <p className="text-xs text-[#8a7762]">
                      Od: {item.invitedBy?.name || item.invitedBy?.email || "nieznany użytkownik"}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#b3a18f]">
                      {new Intl.DateTimeFormat("pl-PL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(item.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await respondToInvite(item.id, "accept");
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-300"
                    >
                      Akceptuj
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await respondToInvite(item.id, "decline");
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 transition hover:border-rose-300"
                    >
                      Odrzuć
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
