"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";


type UserRow = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  permissions: string[];
  createdAt: string;
};

type PermissionOption = {
  value: string;
  label: string;
};

type PermissionSelectProps = {
  options: PermissionOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

function PermissionSelect({ options, selected, onChange, disabled }: PermissionSelectProps) {
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

  const toggleValue = (value: string) => {
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
        {selected.length > 0 ? `${selected.length} wybrane` : "Wybierz uprawnienia"}
        <span className="text-[10px] text-[#8d7b68]">{open ? "Zamknij" : "Otworz"}</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[#eadfd3] bg-white p-3 shadow-[0_20px_50px_-35px_rgba(60,40,20,0.45)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj uprawnien..."
            className="w-full rounded-lg border border-[#d7c8b7] bg-[#fcfaf7] px-3 py-2 text-xs text-[#2a241f] outline-none focus:border-[#2a241f]"
          />
          <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#8d7b68]">Brak wynikow.</p>
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
                    <span className="text-[10px]">{active ? "Wybrane" : ""}</span>
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

export default function SettingsUsersPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [canCreateUsers, setCanCreateUsers] = useState(false);
  const [canUpdateUsers, setCanUpdateUsers] = useState(false);
  const [canRemoveUsers, setCanRemoveUsers] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<UserRow | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currentUserId = session?.user?.id || "";

  const permissionLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of permissionOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [permissionOptions]);

  const filteredUsers = useMemo(() => {
    const normalized = userQuery.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(normalized) ||
        (user.name || "").toLowerCase().includes(normalized),
    );
  }, [userQuery, users]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
      return;
    }
    if (!session?.user) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setUsersLoading(true);
      setError(null);
      setUsersError(null);
      try {
        const [settingsResponse, usersResponse, permissionsResponse] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/users"),
          fetch("/api/permissions"),
        ]);
        const settingsPayload = await settingsResponse.json();
        if (!settingsResponse.ok) {
          setError(settingsPayload?.message || "Nie udalo sie pobrac ustawien.");
        } else {
          const permissions = settingsPayload?.user?.permissions || [];
          const canViewUsers = permissions.includes("CREATE_USERS") || permissions.includes("UPDATE_USERS") || permissions.includes("REMOVE_USERS");
          if (!canViewUsers) {
            router.replace("/settings/account");
            return;
          }
          setCanCreateUsers(permissions.includes("CREATE_USERS"));
          setCanUpdateUsers(permissions.includes("UPDATE_USERS"));
          setCanRemoveUsers(permissions.includes("REMOVE_USERS"));
        }

        const permissionsPayload = await permissionsResponse.json();
        if (permissionsResponse.ok) {
          setPermissionOptions(permissionsPayload?.permissions || []);
        }

        const usersPayload = await usersResponse.json();
        if (!usersResponse.ok) {
          setUsersError(usersPayload?.message || "Nie udalo sie pobrac listy kont.");
        } else {
          setUsers(usersPayload?.users || []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nie udalo sie pobrac danych.";
        setError(message);
        setUsersError(message);
      } finally {
        setIsLoading(false);
        setUsersLoading(false);
      }
    };

    load();
  }, [isPending, router, session?.user]);

  const handleInviteSubmit = async () => {
    const trimmedName = inviteName.trim();
    const trimmedEmail = inviteEmail.trim();
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLink(null);
    if (!trimmedName || !trimmedEmail) {
      setInviteError("Uzupelnij imie i email.");
      return;
    }
    setIsInviteLoading(true);
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setInviteError(payload?.message || "Nie udalo sie wygenerowac linku.");
        return;
      }
      setInviteLink(payload?.link || null);
      setInviteSuccess("Wygenerowano link zaproszenia.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udalo sie wygenerowac linku.";
      setInviteError(message);
    } finally {
      setIsInviteLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteSuccess("Link skopiowany.");
    } catch {
      setInviteError("Nie udalo sie skopiowac linku.");
    }
  };

  const startEdit = (user: UserRow) => {
    setEditingUserId(user.id);
    setEditName(user.name || "");
    setEditPermissions(user.permissions || []);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditName("");
    setEditPermissions([]);
  };

  const saveEdit = async () => {
    if (!editingUserId) return;
    try {
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), permissions: editPermissions }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setUsersError(payload?.message || "Nie udalo sie zapisac zmian.");
        return;
      }
      setUsers((prev) =>
        prev.map((user) => (user.id === editingUserId ? payload.user : user)),
      );
      cancelEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udalo sie zapisac zmian.";
      setUsersError(message);
    }
  };

  const deleteUser = async (user: UserRow) => {
    if (!canRemoveUsers || user.id === currentUserId) return;
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        setUsersError(payload?.message || "Nie udalo sie usunac konta.");
        return;
      }
      setUsers((prev) => prev.filter((row) => row.id !== user.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udalo sie usunac konta.";
      setUsersError(message);
    }
  };

  const requestDelete = (user: UserRow) => {
    if (!canRemoveUsers || user.id === currentUserId) return;
    setDeleteCandidate(user);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    await deleteUser(deleteCandidate);
    setDeleteCandidate(null);
  };

  const getInitials = (name: string, email: string) => {
    const value = name || email;
    const parts = value.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  };

  return (
    <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
      <CardContent className="space-y-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
            All accounts
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#2a241f]">Zarzadzanie kontami</h2>
              <p className="mt-2 text-sm text-[#6f6255]">
                Lista wszystkich uzytkownikow w organizacji.
              </p>
            </div>
            <div className="rounded-full border border-[#eadfd3] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68] shadow-sm">
              {users.length} kont
            </div>
          </div>
        </div>

        {isLoading ? <p className="text-sm text-[#6f6255]">Ladowanie...</p> : null}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-6 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                Zaproszenia
              </p>
              <p className="mt-1 text-sm text-[#6f6255]">
                Wygeneruj link do rejestracji dla nowego uzytkownika.
              </p>
            </div>
            <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
              Create users
            </span>
          </div>

          {canCreateUsers ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.2fr_1.2fr_auto]">
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
                    htmlFor="inviteName"
                  >
                    Imie i nazwisko
                  </label>
                  <input
                    id="inviteName"
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
                    htmlFor="inviteEmail"
                  >
                    Email
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="w-full bg-[#2a241f] text-[#f6efe8] hover:bg-[#3a332c]"
                    onClick={handleInviteSubmit}
                    disabled={isInviteLoading}
                  >
                    {isInviteLoading ? "Generowanie..." : "Generuj link"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {inviteLink ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7c8b7] bg-white px-3 py-2 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                    onClick={handleCopyInvite}
                  >
                    Kopiuj link
                  </button>
                ) : null}
              </div>

              {inviteLink ? (
                <div className="rounded-lg border border-[#eadfd3] bg-white px-3 py-2 text-xs text-[#6f6255] break-all">
                  {inviteLink}
                </div>
              ) : null}

              {inviteError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {inviteError}
                </div>
              ) : null}
              {inviteSuccess ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {inviteSuccess}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-[#eadfd3] bg-[#f8f4ef] px-3 py-2 text-xs text-[#6f6255]">
              Brak uprawnien do tworzenia kont.
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-6 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
              Lista uzytkownikow
            </p>
            <input
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Szukaj po nazwie lub emailu"
              className="w-full rounded-full border border-[#d7c8b7] bg-white px-4 py-2 text-xs text-[#2a241f] outline-none focus:border-[#2a241f] md:w-64"
            />
          </div>

          {usersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {usersError}
            </div>
          ) : null}

          {usersLoading ? <p className="text-sm text-[#6f6255]">Ladowanie listy...</p> : null}

          {!usersLoading && filteredUsers.length === 0 && !usersError ? (
            <div className="rounded-lg border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
              Brak uzytkownikow do wyswietlenia.
            </div>
          ) : null}

          {filteredUsers.length > 0 ? (
            <div className="space-y-3">
              <div className="grid gap-3 rounded-2xl border border-[#eadfd3] bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68] md:grid-cols-[1.6fr_1.6fr_2.3fr_1fr]">
                <span>Uzytkownik</span>
                <span>Email</span>
                <span>Uprawnienia</span>
                <span className="text-right">Akcje</span>
              </div>

              {filteredUsers.map((user) => {
                const isEditing = editingUserId === user.id;
                const isSelf = user.id === currentUserId;
                const permissionLabelsList = (user.permissions || []).map(
                  (permission) => permissionLabels.get(permission) || permission,
                );
                const visiblePermissions = permissionLabelsList.slice(0, 2);
                const hiddenCount = Math.max(permissionLabelsList.length - visiblePermissions.length, 0);
                if (isEditing) {
                  return (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-5 text-sm text-[#5c4f45] shadow-sm"
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.2fr)] md:items-start">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border border-[#eadfd3] bg-[#f8f4ef]">
                              {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                              <AvatarFallback className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                {getInitials(user.name || "", user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <input
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                className="w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 break-all text-center text-sm text-[#6f6255] md:flex md:items-center md:justify-center">
                          {user.email}
                        </div>
                        <div className="flex flex-col items-end justify-start gap-2">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-[#d7c8b7] px-3 py-1 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                              onClick={cancelEdit}
                            >
                              Anuluj
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-[#2a241f] bg-[#2a241f] px-3 py-1 text-xs text-[#f6efe8] shadow-sm transition hover:bg-[#3a332c]"
                              onClick={saveEdit}
                            >
                              Zapisz
                            </button>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68]">
                            {new Date(user.createdAt).toLocaleDateString("pl-PL")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-[#f0e6db] pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d7b68]">
                          Uprawnienia
                        </p>
                        <div className="mt-3">
                          <PermissionSelect
                            options={permissionOptions}
                            selected={editPermissions}
                            onChange={setEditPermissions}
                            disabled={!canUpdateUsers}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={user.id}
                    className={`grid gap-4 rounded-2xl border border-[#eadfd3] bg-white px-4 py-5 text-sm text-[#5c4f45] shadow-sm ${
                      "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,2.3fr)_minmax(0,1fr)] md:items-center"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-[#eadfd3] bg-[#f8f4ef]">
                          {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                          <AvatarFallback className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                            {getInitials(user.name || "", user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div>
                            <p className="font-semibold text-[#2a241f]">{user.name || "-"}</p>
                            {isSelf ? (
                              <span className="mt-2 inline-flex rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6255]">
                                To Ty
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 break-all text-center text-sm text-[#6f6255] md:flex md:items-center md:justify-center">
                      {user.email}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {permissionLabelsList.length === 0 ? (
                          <span className="text-xs text-[#8d7b68]">Brak</span>
                        ) : (
                          <>
                            {visiblePermissions.map((label) => (
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
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-start gap-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className={`rounded-full border px-3 py-1 text-xs shadow-sm transition hover:shadow-md ${
                            canUpdateUsers
                              ? "border-[#d7c8b7] text-[#2a241f] hover:border-[#2a241f]"
                              : "border-[#eadfd3] text-[#b3a79b]"
                          }`}
                          onClick={() => canUpdateUsers && startEdit(user)}
                          disabled={!canUpdateUsers}
                        >
                          Zmien
                        </button>
                        <button
                          type="button"
                          className={`rounded-full border px-3 py-1 text-xs shadow-sm transition hover:shadow-md ${
                            canRemoveUsers && !isSelf
                              ? "border-red-200 text-red-700 hover:border-red-400"
                              : "border-[#eadfd3] text-[#b3a79b]"
                          }`}
                          onClick={() => requestDelete(user)}
                          disabled={!canRemoveUsers || isSelf}
                        >
                          Usun
                        </button>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68]">
                        {new Date(user.createdAt).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
        {isMounted && deleteCandidate
          ? createPortal(
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setDeleteCandidate(null)}
                />
                <div className="relative w-full max-w-md rounded-2xl border border-[#eadfd3] bg-white p-6 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.6)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                    Potwierdzenie
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#2a241f]">
                    Usun konto uzytkownika
                  </h3>
                  <p className="mt-2 text-sm text-[#6f6255]">
                    Czy na pewno chcesz usunac konto{" "}
                    <span className="font-semibold text-[#2a241f]">
                      {deleteCandidate.email}
                    </span>
                    ?
                  </p>
                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-[#d7c8b7] px-4 py-2 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                      onClick={() => setDeleteCandidate(null)}
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:border-red-400"
                      onClick={confirmDelete}
                    >
                      Potwierdz usuniecie
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </CardContent>
    </Card>
  );
}
