"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/i18n/useI18n";
import { authClient } from "@/lib/auth-client";
import {
  DASHBOARD_MANAGE_PERMISSION,
  DASHBOARD_POST_PERMISSION,
  AI_USE_PERMISSION,
  PROJECT_EDIT_PERMISSION,
  PROJECT_REMOVE_PERMISSION,
  PROJECT_MEMBER_PERMISSIONS,
  PROJECT_USERS_MANAGE_PERMISSION,
  TASK_MESSAGE_CRUD_PERMISSION,
  TASK_VIEW_PERMISSION,
  TASKS_CUD_PERMISSION,
} from "@/lib/projects/permissions";
import { useProjectContext } from "./project-context";

type MemberPermission = (typeof PROJECT_MEMBER_PERMISSIONS)[number];

type MemberRow = {
  id: string;
  role: string;
  permissions: MemberPermission[];
  createdAt: string;
  isOwner?: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

type InviteRow = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  displayStatus?: string;
  expiresAt?: string;
  invitedById?: string;
  invitedUser?: { id: string; name: string | null; email: string | null; image: string | null };
  invitedBy?: { id: string; name: string | null; email: string | null; image: string | null };
};

type PermissionOption = {
  value: MemberPermission;
  label: string;
};

type PermissionSelectProps = {
  options: PermissionOption[];
  selected: MemberPermission[];
  onChange: (next: MemberPermission[]) => void;
  disabled?: boolean;
  t: (key: string) => string;
};

function PermissionSelect({ options, selected, onChange, disabled, t }: PermissionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleClickAway = useCallback(() => {
    if (open) {
      setOpen(false);
    }
  }, [open]);

  useClickAway(containerRef, handleClickAway);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.value.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const toggleValue = (value: MemberPermission) => {
    if (selected.includes(value)) {
      onChange(selected.filter((perm) => perm !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm transition ${
          disabled
            ? "border-[#eadfd3] bg-[#f8f4ef] text-[#b3a79b]"
            : "border-[#d7c8b7] bg-white text-[#2a241f] hover:border-[#2a241f]"
        }`}
      >
        {selected.length > 0
          ? `${selected.length} ${t("settings.users.permissions.selected")}`
          : t("settings.users.permissions.placeholder")}
        <span className="text-[10px] text-[#8d7b68]">
          {open ? t("common.close") : t("common.open")}
        </span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[#eadfd3] bg-white p-3 shadow-[0_20px_50px_-35px_rgba(60,40,20,0.45)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("settings.users.permissions.search")}
            className="w-full rounded-lg border border-[#d7c8b7] bg-[#fcfaf7] px-3 py-2 text-xs text-[#2a241f] outline-none focus:border-[#2a241f]"
          />
          <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#8d7b68]">{t("settings.users.permissions.empty")}</p>
            ) : (
              filtered.map((option) => {
                const active = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      active
                        ? "border-[#2a241f] bg-[#2a241f] text-[#f6efe8]"
                        : "border-[#eadfd3] bg-white text-[#6f6255] hover:border-[#2a241f]"
                    }`}
                  >
                    {option.label}
                    <span className="text-[10px]">
                      {active ? t("settings.users.permissions.active") : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const getInitials = (value: string | null | undefined) => {
  if (!value) return "•";
  const parts = value.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export default function ProjectUsers() {
  const project = useProjectContext();
  const { t, locale } = useI18n();
  const { data: session } = authClient.useSession();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [sentInvites, setSentInvites] = useState<InviteRow[]>([]);
  const [pendingInvite, setPendingInvite] = useState<boolean>(Boolean(project.pendingInvite));
  const [canInvite, setCanInvite] = useState<boolean>(Boolean(project.canInvite));
  const [availablePermissions, setAvailablePermissions] = useState<MemberPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [openInviteId, setOpenInviteId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberEdits, setMemberEdits] = useState<
    Record<
      string,
      {
        role: string;
        permissions: Set<MemberPermission>;
      }
    >
  >({});
  const permissionLabels = useMemo(
    () => ({
      [PROJECT_USERS_MANAGE_PERMISSION]: "Users manage",
      [DASHBOARD_MANAGE_PERMISSION]: "Dashboard",
      [DASHBOARD_POST_PERMISSION]: "Dashboard posts",
      [TASK_VIEW_PERMISSION]: "Tasks view",
      [TASKS_CUD_PERMISSION]: "Tasks CUD",
      [TASK_MESSAGE_CRUD_PERMISSION]: "Task messages",
      [AI_USE_PERMISSION]: "AI use",
      [PROJECT_REMOVE_PERMISSION]: "Project remove",
      [PROJECT_EDIT_PERMISSION]: "Project edit",
    }),
    [],
  );
  const permissionOptions = useMemo<PermissionOption[]>(
    () => {
      const source = availablePermissions.length
        ? availablePermissions
        : Array.from(PROJECT_MEMBER_PERMISSIONS);
      return source.map((permission) => ({
        value: permission,
        label: permissionLabels[permission] || permission,
      }));
    },
    [availablePermissions, permissionLabels],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersResponse, invitesResponse] = await Promise.all([
        fetch(`/api/project/${project.id}/members`),
        fetch(`/api/project/${project.id}/invites`),
      ]);

      const membersPayload = await membersResponse.json();
      if (membersResponse.ok) {
        setMembers(Array.isArray(membersPayload?.members) ? membersPayload.members : []);
        if (typeof membersPayload?.canInvite === "boolean") {
          setCanInvite(membersPayload.canInvite);
        }
        if (Array.isArray(membersPayload?.availablePermissions)) {
          const allowedSet = new Set<MemberPermission>(PROJECT_MEMBER_PERMISSIONS);
          const filtered = (membersPayload.availablePermissions as unknown[]).filter(
            (permission): permission is MemberPermission =>
              typeof permission === "string" && allowedSet.has(permission as MemberPermission),
          );
          setAvailablePermissions(filtered);
        } else {
          setAvailablePermissions([]);
        }
        if (typeof membersPayload?.canManageUsers === "boolean") {
          setCanInvite(membersPayload.canManageUsers);
        }
        if (typeof membersPayload?.pendingInvite === "boolean") {
          setPendingInvite(membersPayload.pendingInvite);
        }
    } else {
      setError(membersPayload?.message || t("project.view.users.errors.loadFailed"));
    }

      const invitesPayload = await invitesResponse.json();
      if (invitesResponse.ok) {
        setSentInvites(invitesPayload?.invitations?.sent || []);
        if (typeof invitesPayload?.pendingInvite === "boolean") {
          setPendingInvite(invitesPayload.pendingInvite);
        }
      } else if (!error) {
        setError(invitesPayload?.message || t("project.view.users.errors.loadFailed"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.view.users.errors.loadFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const handleInvite = async () => {
    const normalized = inviteEmail.trim();
    setInviteError(null);
    setInviteSuccess(null);
    if (!normalized) {
      setInviteError(t("project.view.users.invite.missing"));
      return;
    }
    setSending(true);
    try {
      const response = await fetch(`/api/project/${project.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setInviteError(payload?.message || t("project.view.users.invite.error"));
        return;
      }
      setInviteEmail("");
      setInviteSuccess(t("project.view.users.invite.success"));
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.view.users.invite.error");
      setInviteError(message);
    } finally {
      setSending(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setError(null);
    setRevokingId(inviteId);
    try {
      const response = await fetch(`/api/project/${project.id}/invites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action: "revoke" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.message || t("project.view.users.errors.loadFailed"));
        return;
      }
      if (payload?.invite) {
        setSentInvites((prev) =>
          prev.map((inv) => (inv.id === inviteId ? payload.invite : inv)),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.view.users.errors.loadFailed");
      setError(message);
    } finally {
      setRevokingId(null);
    }
  };

  const updateMemberEdit = (
    memberId: string,
    updater: (current: { role: string; permissions: Set<MemberPermission> }) => {
      role: string;
      permissions: Set<MemberPermission>;
    },
  ) => {
    setMemberEdits((prev) => {
      const baseMember = prev[memberId] ?? {
        role: members.find((m) => m.id === memberId)?.role ?? "EDITOR",
        permissions: new Set<MemberPermission>(
          members.find((m) => m.id === memberId)?.permissions ?? [],
        ),
      };
      return { ...prev, [memberId]: updater(baseMember) };
    });
  };

  const handleSaveMember = async (memberId: string) => {
    const edit = memberEdits[memberId];
    const member = members.find((m) => m.id === memberId);
    if (!member || !edit) return;
    setError(null);
    try {
      const response = await fetch(`/api/project/${project.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          role: edit.role,
          permissions: Array.from(edit.permissions),
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.message || t("project.view.users.errors.loadMembersFailed"));
        return;
      }
      await load();
      setEditingMemberId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("project.view.users.errors.loadMembersFailed");
      setError(message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    setError(null);
    try {
      const response = await fetch(`/api/project/${project.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action: "remove" }),
      });
      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.message || t("project.view.users.errors.loadMembersFailed"));
        return;
      }
      await load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("project.view.users.errors.loadMembersFailed");
      setError(message);
    }
  };

  const startEditMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    setEditingMemberId(memberId);
    setMemberEdits((prev) => ({
      ...prev,
      [memberId]: {
        role: member.role,
        permissions: new Set<MemberPermission>(member.permissions ?? []),
      },
    }));
  };

  const cancelEditMember = (memberId: string) => {
    setEditingMemberId((current) => (current === memberId ? null : current));
    setMemberEdits((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  return (
    <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_30px_70px_-45px_rgba(40,30,20,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7762]">
            {t("project.view.users.badge")}
          </p>
          <h2 className="text-2xl font-semibold text-[#1f1b16]">
            {t("project.view.users.title")}
          </h2>
          <p className="text-sm text-[#5b5044]">{t("project.view.users.subtitle")}</p>
        </div>
        {pendingInvite ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
            {t("project.view.users.invite.pending")}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {inviteError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {inviteError}
        </div>
        ) : null}

        {inviteSuccess ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {inviteSuccess}
        </div>
      ) : null}

      <div className="mt-6">
        <div className="w-full space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7762]">
              {t("project.view.users.invite.label")}
            </p>
            <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
              {canInvite ? t("project.view.users.invite.badge") : t("project.view.users.invite.locked")}
            </span>
          </div>

          {canInvite ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  {t("project.view.users.invite.email")}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder={t("project.view.users.invite.placeholder")}
                  className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                />
              </div>
              <button
                type="button"
                onClick={handleInvite}
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
              >
                {sending ? t("project.view.users.invite.sending") : t("project.view.users.invite.cta")}
              </button>
              <p className="text-xs text-[#8a7762]">{t("project.view.users.invite.hint")}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
              {t("project.view.users.noPermission")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7762]">
            {t("project.view.users.members.title")}
          </p>
          <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
            {members.length} {t("project.view.users.members.count")}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-[#6f6255]">{t("common.loading")}</p>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
            {t("project.view.users.members.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 rounded-2xl border border-[#eadfd3] bg-white/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a7762] md:grid-cols-[1.6fr_1.6fr_2.3fr_1fr]">
              <span>{t("settings.users.list.headers.user")}</span>
              <span>{t("settings.users.list.headers.email")}</span>
              <span>{t("settings.users.list.headers.permissions")}</span>
              <span className="text-right">{t("settings.users.list.headers.actions")}</span>
            </div>
            {members.map((member) => {
              const isEditing = editingMemberId === member.id;
              const edit = memberEdits[member.id];
              const permissionSet =
                edit?.permissions ?? new Set<MemberPermission>(member.permissions ?? []);
              const isSelf = session?.user?.id === member.user.id;
              const permissionBadges = Array.from(permissionSet);

              if (isEditing) {
                return (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-5 text-sm text-[#5c4f45] shadow-sm"
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,2.3fr)_minmax(0,1fr)] md:items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-[#eadfd3] bg-[#f8f4ef]">
                            {member.user.image ? (
                              <AvatarImage
                                src={member.user.image}
                                alt={member.user.name || member.user.email || "user"}
                              />
                            ) : null}
                            <AvatarFallback className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                              {getInitials(member.user.name || member.user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#2a241f]">
                              {member.user.name || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 break-all text-center text-sm text-[#6f6255] md:flex md:items-center md:justify-center">
                        {member.user.email}
                      </div>
                      <div className="min-w-0" />
                      <div className="flex flex-col items-end justify-start gap-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-[#d7c8b7] px-3 py-1 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                            onClick={() => cancelEditMember(member.id)}
                          >
                            {t("common.cancel")}
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-[#2a241f] bg-[#2a241f] px-3 py-1 text-xs text-[#f6efe8] shadow-sm transition hover:bg-[#3a332c]"
                            onClick={() => handleSaveMember(member.id)}
                          >
                            {t("common.saveChanges") ?? t("common.save")}
                          </button>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68]">
                          {dateFormatter.format(new Date(member.createdAt))}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-[#f0e6db] pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d7b68]">
                        {t("settings.users.list.permissionsLabel")}
                      </p>
                      <div className="mt-3">
                        <PermissionSelect
                          options={permissionOptions}
                          selected={Array.from(permissionSet)}
                          onChange={(next) =>
                            updateMemberEdit(member.id, (current) => ({
                              ...current,
                              permissions: new Set<MemberPermission>(next),
                            }))
                          }
                          disabled={!canInvite}
                          t={t}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={member.id}
                  className="grid gap-4 rounded-2xl border border-[#eadfd3] bg-white px-4 py-5 text-sm text-[#5c4f45] shadow-sm md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,2.3fr)_minmax(0,1fr)] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border border-[#eadfd3] bg-[#f8f4ef]">
                        {member.user.image ? (
                          <AvatarImage
                            src={member.user.image}
                            alt={member.user.name || member.user.email || "user"}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                          {getInitials(member.user.name || member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#2a241f]">{member.user.name || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 break-all text-center text-sm text-[#6f6255] md:flex md:items-center md:justify-center">
                    {member.user.email}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {member.permissions?.length ? (
                        (() => {
                          const labels = permissionBadges.map(
                            (permission) => permissionLabels[permission] || permission,
                          );
                          const visible = labels.slice(0, 2);
                          const hiddenCount = Math.max(labels.length - visible.length, 0);
                          return (
                            <>
                              {visible.map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]"
                                >
                                  {label}
                                </span>
                              ))}
                              {hiddenCount > 0 ? (
                                <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8d7b68]">
                                  +{hiddenCount}
                                </span>
                              ) : null}
                            </>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-[#8d7b68]">
                          {t("settings.users.list.permissionsEmpty")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-start gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs shadow-sm transition hover:shadow-md ${
                          canInvite
                            ? "border-[#d7c8b7] text-[#2a241f] hover:border-[#2a241f]"
                            : "border-[#eadfd3] text-[#b3a79b]"
                        }`}
                        onClick={() => canInvite && startEditMember(member.id)}
                        disabled={!canInvite}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs shadow-sm transition hover:shadow-md ${
                          canInvite && !isSelf
                            ? "border-rose-200 text-rose-800 hover:border-rose-400"
                            : "border-[#eadfd3] text-[#b3a79b]"
                        }`}
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={!canInvite || isSelf}
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68]">
                      {dateFormatter.format(new Date(member.createdAt))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canInvite ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7762]">
              {t("project.view.users.sent.title")}
            </p>
            <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
              {sentInvites.length}
            </span>
          </div>
            {loading ? (
              <p className="text-sm text-[#6f6255]">{t("common.loading")}</p>
            ) : sentInvites.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                {t("project.view.users.sent.empty")}
              </div>
            ) : (
              <div className="space-y-3">
                {sentInvites.map((invite) => {
                  const displayStatus =
                    invite.displayStatus ||
                    (invite.status === "PENDING" &&
                    new Date(invite.createdAt).getTime() <
                      Date.now() - 7 * 24 * 60 * 60 * 1000
                      ? "EXPIRED"
                      : invite.status);
                  const statusClass =
                    displayStatus === "ACCEPTED"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : displayStatus === "PENDING"
                        ? "border border-amber-200 bg-amber-50 text-amber-800"
                        : "border border-[#eadfd3] bg-[#f8f4ef] text-[#6f6255]";
                  const statusLabel =
                    displayStatus === "ACCEPTED"
                      ? t("project.view.users.status.accepted")
                      : displayStatus === "EXPIRED"
                        ? `${t("project.view.users.status.pending")} (expired)`
                        : displayStatus === "REVOKED"
                          ? "Revoked"
                          : displayStatus === "DECLINED"
                            ? "Declined"
                            : t("project.view.users.status.pending");
                  const isPending = displayStatus === "PENDING";
                  const statusDate = dateFormatter.format(new Date(invite.updatedAt || invite.createdAt));
                  const isOpen = openInviteId === invite.id;
                  return (
                    <div
                      key={invite.id}
                      className="rounded-xl border border-[#eadfd3] bg-white px-4 py-3 text-sm text-[#2a241f] shadow-sm"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
                        onClick={() => setOpenInviteId((current) => (current === invite.id ? null : invite.id))}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-[#eadfd3] bg-[#f8f4ef] text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6255]">
                            {invite.invitedUser?.image ? (
                              <AvatarImage
                                src={invite.invitedUser.image}
                                alt={invite.invitedUser.name || invite.invitedUser.email || "user"}
                              />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(invite.invitedUser?.name || invite.invitedUser?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1f1b16]">
                              {invite.invitedUser?.name || invite.invitedUser?.email || "-"}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-[#8a7762]">
                              {dateFormatter.format(new Date(invite.createdAt))}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7762]">
                            Kliknij, aby dowiedzieć się więcej
                          </span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e6db] pt-3">
                              <div className="space-y-1">
                                <p className="text-xs text-[#8a7762]">
                                  {invite.invitedBy?.name || invite.invitedBy?.email || "-"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#b3a18f]">
                                  {invite.expiresAt ? (
                                    <span>Expires {dateFormatter.format(new Date(invite.expiresAt))}</span>
                                  ) : null}
                                  <span>{dateFormatter.format(new Date(invite.createdAt))}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {(displayStatus === "ACCEPTED" || displayStatus === "DECLINED" || displayStatus === "REVOKED") ? (
                                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#8a7762]">
                                    {displayStatus === "ACCEPTED" ? `${t("project.view.users.status.accepted")}: ${statusDate}` : `Declined: ${statusDate}`}
                                  </span>
                                ) : null}
                                {isPending ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    disabled={revokingId === invite.id}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800 transition hover:border-rose-300 disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    {revokingId === invite.id ? t("common.loading") : "Odwołaj"}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      ) : null}
    </div>
  );
}
