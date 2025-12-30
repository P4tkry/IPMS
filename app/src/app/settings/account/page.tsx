"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldArray, Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { Globe, Github, Linkedin, Plus, Twitter, X } from "lucide-react";


type SettingsForm = {
  name: string;
  bio: string;
  socialLinks: Array<{ platform: string; url: string }>;
};

export default function SettingsAccountPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canUploadPhotos, setCanUploadPhotos] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const didLoad = useRef(false);
  const formikRef = useRef<FormikProps<SettingsForm>>(null);
  const platformOptions = useMemo(
    () => [
      { value: "GITHUB", label: "GitHub" },
      { value: "LINKEDIN", label: "LinkedIn" },
      { value: "X", label: "X" },
      { value: "WEBSITE", label: "Website" },
    ],
    [],
  );
  const platformMeta = useMemo(
    () => ({
      GITHUB: {
        label: "GitHub",
        Icon: Github,
        badge: "bg-[#231f1b] text-[#f6efe8]",
        chip: "from-[#2b2621] to-[#3b342d]",
      },
      LINKEDIN: {
        label: "LinkedIn",
        Icon: Linkedin,
        badge: "bg-[#1d4f91] text-[#f4f6fb]",
        chip: "from-[#1f5aa5] to-[#2a6dc2]",
      },
      X: {
        label: "X",
        Icon: X,
        badge: "bg-[#2a241f] text-[#f6efe8]",
        chip: "from-[#1f1b17] to-[#3a332c]",
      },
      WEBSITE: {
        label: "Website",
        Icon: Globe,
        badge: "bg-[#9a5a2c] text-[#fff5ea]",
        chip: "from-[#b16330] to-[#d68d53]",
      },
      DEFAULT: {
        label: "Social",
        Icon: Twitter,
        badge: "bg-[#6a5c4c] text-[#f6efe8]",
        chip: "from-[#806f5c] to-[#a08a72]",
      },
    }),
    [],
  );

  const initialValues: SettingsForm = {
    name: "",
    bio: "",
    socialLinks: [],
  };
  const validationSchema = Yup.object({
    name: Yup.string()
      .max(120, "Imie i nazwisko moze miec max 120 znakow.")
      .required("Imie i nazwisko jest wymagane."),
    bio: Yup.string().max(280, "Opis moze miec max 280 znakow."),
    socialLinks: Yup.array().of(
      Yup.object({
        platform: Yup.string().required("Wybierz platforme."),
        url: Yup.string().url("Podaj poprawny link.").required("Link jest wymagany."),
      }),
    ),
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
      return;
    }
    if (!session?.user || didLoad.current) {
      return;
    }
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/settings");
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.message || "Nie udalo sie pobrac ustawien.");
          return;
        }
        formikRef.current?.setValues({
          name: payload?.user?.name || "",
          bio: payload?.user?.bio || "",
          socialLinks: payload?.user?.socialLinks || [],
        });
        setProfileImage(payload?.user?.image || null);
        const permissions = payload?.user?.permissions || [];
        setCanUploadPhotos(permissions.includes("UPLOAD_PHOTOS"));
        didLoad.current = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nie udalo sie pobrac ustawien.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isPending, router, session?.user]);

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        setUploadError(payload?.message || "Nie udalo sie przeslac zdjecia.");
        return;
      }
      setProfileImage(payload?.url || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udalo sie przeslac zdjecia.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
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
            My account
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2a241f]">Profil uzytkownika</h2>
          <p className="mt-2 text-sm text-[#6f6255]">
            Zaktualizuj imie i nazwisko oraz opis profilu.
          </p>
        </div>

        {isLoading ? <p className="text-sm text-[#6f6255]">Ladowanie...</p> : null}
        <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-[#eadfd3] bg-[#f8f4ef]">
              {profileImage ? <AvatarImage src={profileImage} alt="Profile image" /> : null}
              <AvatarFallback className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6255]">
                {getInitials(formikRef.current?.values.name || "", session?.user?.email || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-[#2a241f]">Zdjecie profilowe</p>
              <p className="mt-1 text-xs text-[#6f6255]">
                PNG/JPG do 5MB. Widoczne w profilu.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow-sm transition ${
                canUploadPhotos
                  ? "border-[#d7c8b7] bg-white text-[#2a241f] hover:border-[#2a241f]"
                  : "border-[#eadfd3] bg-[#f8f4ef] text-[#b3a79b]"
              }`}
            >
              {isUploading ? "Przesylanie..." : "Zmien zdjecie"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={!canUploadPhotos || isUploading}
              />
            </label>
          </div>
          {uploadError ? (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {uploadError}
            </div>
          ) : null}
        </section>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            setError(null);
            setSuccess(null);
            try {
              const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(values),
              });
              const payload = await response.json();
              if (!response.ok) {
                setError(payload?.message || "Nie udalo sie zapisac zmian.");
                return;
              }
              setSuccess("Zapisano zmiany.");
            } catch (err) {
              const message = err instanceof Error ? err.message : "Nie udalo sie zapisac zmian.";
              setError(message);
            }
          }}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-6">
              <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
                    htmlFor="name"
                  >
                    Imie i nazwisko
                  </label>
                  <Field
                    id="name"
                    name="name"
                    className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                  />
                  {touched.name && errors.name ? (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  ) : null}
                </div>
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
                    htmlFor="bio"
                  >
                    Opis
                  </label>
                  <Field
                    as="textarea"
                    id="bio"
                    name="bio"
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                  />
                  {touched.bio && errors.bio ? (
                    <p className="mt-1 text-xs text-red-600">{errors.bio}</p>
                  ) : null}
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                      Social links
                    </p>
                    <p className="mt-1 text-sm text-[#6f6255]">
                      Dodaj linki do profili. Beda widoczne w profilu.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7c8b7] bg-white px-3 py-1 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                    onClick={() =>
                      setFieldValue("socialLinks", [
                        ...values.socialLinks,
                        { platform: "GITHUB", url: "" },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Dodaj
                  </button>
                </div>

                <FieldArray
                  name="socialLinks"
                  render={(arrayHelpers) => (
                    <div className="space-y-3">
                      {values.socialLinks.length === 0 ? (
                        <p className="text-xs text-[#8d7b68]">Brak dodanych linkow.</p>
                      ) : null}
                      {values.socialLinks.map((link, index) => {
                        const linkErrors =
                          (errors.socialLinks?.[index] as { url?: string }) || undefined;
                        const linkTouched =
                          (touched.socialLinks?.[index] as { url?: boolean }) || undefined;
                        const meta =
                          platformMeta[link.platform as keyof typeof platformMeta] ||
                          platformMeta.DEFAULT;
                        const PlatformIcon = meta.Icon;
                        return (
                          <div
                            key={`${link.platform}-${index}`}
                            className="grid items-center gap-4 rounded-2xl border border-[#eadfd3] bg-gradient-to-br from-white/70 via-[#f9f3ed] to-[#f1e6d9] p-4 shadow-[0_18px_40px_-35px_rgba(60,40,20,0.5)] md:grid-cols-[64px_170px_1fr_auto]"
                          >
                            <div className="flex items-center justify-center">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.chip} text-white shadow-[0_12px_24px_-16px_rgba(40,30,20,0.8)]`}
                              >
                                <PlatformIcon className="h-5 w-5" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                                  Platforma
                                </label>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.badge}`}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <Field
                                as="select"
                                name={`socialLinks.${index}.platform`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                              >
                                {platformOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </Field>
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                                Link
                              </label>
                              <Field
                                name={`socialLinks.${index}.url`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                                placeholder="https://"
                              />
                              {linkTouched?.url && linkErrors?.url ? (
                                <p className="mt-1 text-xs text-red-600">{linkErrors.url}</p>
                              ) : null}
                            </div>
                            <div className="flex items-end justify-end">
                              <button
                                type="button"
                                className="rounded-full border border-[#d7c8b7] px-3 py-1 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                                onClick={() => arrayHelpers.remove(index)}
                              >
                                Usun
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </section>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-[#2a241f] text-[#f6efe8] hover:bg-[#3a332c]"
                disabled={isSubmitting}
              >
                Zapisz zmiany
              </Button>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
