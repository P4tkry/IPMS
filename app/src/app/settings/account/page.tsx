"use client";

import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldArray, Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { Globe, Github, Linkedin, Plus, Twitter, X } from "lucide-react";
import { useI18n } from "@/i18n/useI18n";


type SettingsForm = {
  name: string;
  bio: string;
  hobbies: string[];
  strengths: string[];
  weaknesses: string[];
  career: Array<{
    startDate: string;
    position: string;
    companyName: string;
    duration: string;
  }>;
  socialLinks: Array<{ platform: string; url: string }>;
};

type TagInputProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string[];
  error?: string;
  onChange: (next: string[]) => void;
  onBlur?: () => void;
};

function TagInput({ id, label, placeholder, value, error, onChange, onBlur }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(inputValue);
      setInputValue("");
      return;
    }
    if (event.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue("");
    }
    onBlur?.();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]" htmlFor={id}>
        {label}
      </label>
      <div className="mt-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 shadow-sm transition focus-within:border-[#2a241f] focus-within:ring-2 focus-within:ring-[#2a241f]/10">
        <div className="flex flex-wrap items-center gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]"
            >
              {tag}
              <button
                type="button"
                className="text-[10px] text-[#8d7b68] transition hover:text-[#2a241f]"
                onClick={() => removeTag(tag)}
              >
                x
              </button>
            </span>
          ))}
          <input
            id={id}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="min-w-[160px] flex-1 border-0 bg-transparent text-sm text-[#2a241f] outline-none placeholder:text-[#b3a79b]"
          />
        </div>
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export default function SettingsAccountPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useI18n();
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
    hobbies: [],
    strengths: [],
    weaknesses: [],
    career: [],
    socialLinks: [],
  };
  const validationSchema = Yup.object({
    name: Yup.string()
      .max(120, t("settings.account.validation.nameMax"))
      .required(t("settings.account.validation.nameRequired")),
    bio: Yup.string().max(280, t("settings.account.validation.bioMax")),
    hobbies: Yup.array()
      .of(
        Yup.string()
          .trim()
          .min(1, t("settings.account.validation.hobbyMin"))
          .max(40, t("settings.account.validation.hobbyMax")),
      )
      .max(20, t("settings.account.validation.hobbyLimit")),
    strengths: Yup.array()
      .of(
        Yup.string()
          .trim()
          .min(1, t("settings.account.validation.strengthMin"))
          .max(40, t("settings.account.validation.strengthMax")),
      )
      .max(20, t("settings.account.validation.strengthLimit")),
    weaknesses: Yup.array()
      .of(
        Yup.string()
          .trim()
          .min(1, t("settings.account.validation.weaknessMin"))
          .max(40, t("settings.account.validation.weaknessMax")),
      )
      .max(20, t("settings.account.validation.weaknessLimit")),
    career: Yup.array().of(
      Yup.object({
        startDate: Yup.string()
          .matches(/^\d{4}-\d{2}-\d{2}$/, t("settings.account.validation.dateFormat"))
          .required(t("settings.account.validation.startDateRequired")),
        position: Yup.string().trim().required(t("settings.account.validation.positionRequired")),
        companyName: Yup.string()
          .trim()
          .required(t("settings.account.validation.companyRequired")),
        duration: Yup.string().trim().required(t("settings.account.validation.durationRequired")),
      }),
    ),
    socialLinks: Yup.array().of(
      Yup.object({
        platform: Yup.string().required(t("settings.account.validation.platformRequired")),
        url: Yup.string()
          .url(t("settings.account.validation.urlInvalid"))
          .required(t("settings.account.validation.urlRequired")),
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
          setError(payload?.message || t("settings.account.errors.loadFailed"));
          return;
        }
        formikRef.current?.setValues({
          name: payload?.user?.name || "",
          bio: payload?.user?.bio || "",
          hobbies: payload?.user?.hobbies || [],
          strengths: payload?.user?.strengths || [],
          weaknesses: payload?.user?.weaknesses || [],
          career: (payload?.user?.career || []).map(
            (entry: {
              startDate?: string;
              position?: string;
              companyName?: string;
              duration?: string;
            }) => ({
              startDate: entry?.startDate ? String(entry.startDate).slice(0, 10) : "",
              position: entry?.position || "",
              companyName: entry?.companyName || "",
              duration: entry?.duration || "",
            }),
          ),
          socialLinks: payload?.user?.socialLinks || [],
        });
        setProfileImage(payload?.user?.image || null);
        const permissions = payload?.user?.permissions || [];
        setCanUploadPhotos(permissions.includes("UPLOAD_PHOTOS"));
        didLoad.current = true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("settings.account.errors.loadFailed");
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
        setUploadError(payload?.message || t("settings.account.errors.uploadFailed"));
        return;
      }
      setProfileImage(payload?.url || null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("settings.account.errors.uploadFailed");
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
            {t("settings.account.badge")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2a241f]">
            {t("settings.account.title")}
          </h2>
          <p className="mt-2 text-sm text-[#6f6255]">{t("settings.account.subtitle")}</p>
        </div>

        {isLoading ? <p className="text-sm text-[#6f6255]">{t("common.loading")}</p> : null}
        <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-[#eadfd3] bg-[#f8f4ef]">
              {profileImage ? (
                <AvatarImage src={profileImage} alt={t("settings.account.photoAlt")} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6255]">
                {getInitials(formikRef.current?.values.name || "", session?.user?.email || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-[#2a241f]">
                {t("settings.account.photoTitle")}
              </p>
              <p className="mt-1 text-xs text-[#6f6255]">
                {t("settings.account.photoHint")}
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
              {isUploading
                ? t("settings.account.photoUploading")
                : t("settings.account.photoChange")}
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
              const payloadValues = {
                name: values.name,
                bio: values.bio,
                hobbies: values.hobbies,
                strengths: values.strengths,
                weaknesses: values.weaknesses,
                career: values.career,
                socialLinks: values.socialLinks,
              };
              const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payloadValues),
              });
              const payload = await response.json();
              if (!response.ok) {
                setError(payload?.message || t("settings.account.errors.saveFailed"));
                return;
              }
              setSuccess(t("settings.account.success.saved"));
            } catch (err) {
              const message =
                err instanceof Error ? err.message : t("settings.account.errors.saveFailed");
              setError(message);
            }
          }}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue, setFieldTouched }) => (
            <Form className="space-y-6">
              <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
                    htmlFor="name"
                  >
                    {t("settings.account.fields.fullName")}
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
                    {t("settings.account.fields.bio")}
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                    {t("settings.account.profile.title")}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6255]">
                    {t("settings.account.profile.subtitle")}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <TagInput
                    id="hobbies"
                    label={t("settings.account.profile.hobbies")}
                    placeholder={t("settings.account.profile.hobbiesPlaceholder")}
                    value={values.hobbies}
                    onChange={(next) => setFieldValue("hobbies", next)}
                    onBlur={() => setFieldTouched("hobbies", true)}
                    error={touched.hobbies ? (errors.hobbies as string | undefined) : undefined}
                  />
                  <TagInput
                    id="strengths"
                    label={t("settings.account.profile.strengths")}
                    placeholder={t("settings.account.profile.strengthsPlaceholder")}
                    value={values.strengths}
                    onChange={(next) => setFieldValue("strengths", next)}
                    onBlur={() => setFieldTouched("strengths", true)}
                    error={touched.strengths ? (errors.strengths as string | undefined) : undefined}
                  />
                  <TagInput
                    id="weaknesses"
                    label={t("settings.account.profile.weaknesses")}
                    placeholder={t("settings.account.profile.weaknessesPlaceholder")}
                    value={values.weaknesses}
                    onChange={(next) => setFieldValue("weaknesses", next)}
                    onBlur={() => setFieldTouched("weaknesses", true)}
                    error={touched.weaknesses ? (errors.weaknesses as string | undefined) : undefined}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                      {t("settings.account.career.title")}
                    </p>
                    <p className="mt-1 text-sm text-[#6f6255]">
                      {t("settings.account.career.subtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7c8b7] bg-white px-3 py-1 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                    onClick={() =>
                      setFieldValue("career", [
                        ...values.career,
                        { startDate: "", position: "", companyName: "", duration: "" },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("settings.account.career.add")}
                  </button>
                </div>
                <FieldArray
                  name="career"
                  render={(arrayHelpers) => (
                    <div className="space-y-3">
                      {values.career.length === 0 ? (
                        <p className="text-xs text-[#8d7b68]">
                          {t("settings.account.career.empty")}
                        </p>
                      ) : null}
                      {values.career.map((entry, index) => {
                        const careerErrors =
                          (errors.career?.[index] as
                            | {
                                startDate?: string;
                                position?: string;
                                companyName?: string;
                                duration?: string;
                              }
                            | undefined) || undefined;
                        const careerTouched =
                          (touched.career?.[index] as
                            | {
                                startDate?: boolean;
                                position?: boolean;
                                companyName?: boolean;
                                duration?: boolean;
                              }
                            | undefined) || undefined;
                        return (
                          <div
                            key={`career-${index}`}
                            className="grid gap-4 rounded-2xl border border-[#eadfd3] bg-white p-4 shadow-[0_18px_40px_-35px_rgba(60,40,20,0.5)] md:grid-cols-[160px_1fr_1fr_160px_auto]"
                          >
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                                {t("settings.account.career.start")}
                              </label>
                              <Field
                                type="date"
                                name={`career.${index}.startDate`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                              />
                              {careerTouched?.startDate && careerErrors?.startDate ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {careerErrors.startDate}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                                {t("settings.account.career.position")}
                              </label>
                              <Field
                                name={`career.${index}.position`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                                placeholder={t("settings.account.career.positionPlaceholder")}
                              />
                              {careerTouched?.position && careerErrors?.position ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {careerErrors.position}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                                {t("settings.account.career.company")}
                              </label>
                              <Field
                                name={`career.${index}.companyName`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                                placeholder={t("settings.account.career.companyPlaceholder")}
                              />
                              {careerTouched?.companyName && careerErrors?.companyName ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {careerErrors.companyName}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                                {t("settings.account.career.duration")}
                              </label>
                              <Field
                                name={`career.${index}.duration`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                                placeholder={t("settings.account.career.durationPlaceholder")}
                              />
                              {careerTouched?.duration && careerErrors?.duration ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {careerErrors.duration}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-end justify-end">
                              <button
                                type="button"
                                className="rounded-full border border-[#d7c8b7] px-3 py-1 text-xs text-[#2a241f] shadow-sm transition hover:border-[#2a241f] hover:shadow-md"
                                onClick={() => arrayHelpers.remove(index)}
                              >
                                {t("common.remove")}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </section>

              <section className="space-y-4 rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
                      {t("settings.account.social.title")}
                    </p>
                    <p className="mt-1 text-sm text-[#6f6255]">
                      {t("settings.account.social.subtitle")}
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
                    {t("settings.account.social.add")}
                  </button>
                </div>

                <FieldArray
                  name="socialLinks"
                  render={(arrayHelpers) => (
                    <div className="space-y-3">
                      {values.socialLinks.length === 0 ? (
                        <p className="text-xs text-[#8d7b68]">
                          {t("settings.account.social.empty")}
                        </p>
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
                                  {t("settings.account.social.platform")}
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
                                {t("settings.account.social.link")}
                              </label>
                              <Field
                                name={`socialLinks.${index}.url`}
                                className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2a241f]"
                                placeholder={t("settings.account.social.linkPlaceholder")}
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
                                {t("common.remove")}
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
                {t("common.saveChanges")}
              </Button>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
