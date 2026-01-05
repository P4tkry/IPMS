"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Fraunces } from "next/font/google";
import { useI18n } from "@/i18n/useI18n";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
});

type InviteData = {
  name: string;
  email: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { t } = useI18n();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.string().required(t("auth.validation.nameRequired")),
        email: Yup.string()
          .email(t("auth.validation.emailInvalid"))
          .required(t("auth.validation.emailRequired")),
        password: Yup.string()
          .min(8, t("auth.validation.passwordMin"))
          .required(t("auth.validation.passwordRequired")),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password")], t("auth.validation.passwordsMismatch"))
          .required(t("auth.validation.confirmPasswordRequired")),
      }),
    [t],
  );

  useEffect(() => {
    if (!token) {
      setError(t("auth.register.missingToken"));
      setIsLoading(false);
      return;
    }

    const loadInvite = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/invites?token=${encodeURIComponent(token)}`);
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.message || t("auth.register.invalidInvite"));
          return;
        }
        setInvite(payload?.invite || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("auth.register.invalidInvite");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvite();
  }, [t, token]);

  return (
    <div className="relative min-h-screen px-6 text-[#2a241f]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center py-20">
        <Card className="w-full border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
                {t("auth.register.badge")}
              </Badge>
              <h1
                className={`${fraunces.className} text-balance text-3xl font-semibold leading-tight tracking-tight`}
              >
                {t("auth.register.title")}
              </h1>
              <p className="text-sm text-[#6f6255]">{t("auth.register.subtitle")}</p>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#6f6255]">{t("auth.register.loading")}</p>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {invite ? (
              <Formik
                enableReinitialize
                initialValues={{
                  name: invite.name,
                  email: invite.email,
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={validationSchema}
                onSubmit={async (values) => {
                  setError(null);
                  setIsSubmittingInvite(true);
                  try {
                    const response = await fetch("/api/register", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ token, password: values.password }),
                    });
                    const payload = await response.json();
                    if (!response.ok) {
                      setError(payload?.message || t("auth.register.createFailed"));
                      return;
                    }
                    router.replace("/login");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : t("auth.register.createFailed");
                    setError(message);
                  } finally {
                    setIsSubmittingInvite(false);
                  }
                }}
              >
                {({ errors, touched }) => (
                  <Form className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium" htmlFor="name">
                        {t("auth.fields.fullName")}
                      </label>
                      <Field
                        id="name"
                        name="name"
                        disabled
                        className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-[#f8f4ef] px-3 py-2 text-sm text-[#6f6255] outline-none"
                      />
                      {touched.name && errors.name ? (
                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="email">
                        {t("auth.fields.email")}
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        disabled
                        className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-[#f8f4ef] px-3 py-2 text-sm text-[#6f6255] outline-none"
                      />
                      {touched.email && errors.email ? (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="password">
                        {t("auth.fields.password")}
                      </label>
                      <Field
                        id="password"
                        name="password"
                        type="password"
                        className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a241f]"
                      />
                      {touched.password && errors.password ? (
                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="confirmPassword">
                        {t("auth.fields.confirmPassword")}
                      </label>
                      <Field
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a241f]"
                      />
                      {touched.confirmPassword && errors.confirmPassword ? (
                        <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#2a241f] text-[#f6efe8] hover:bg-[#3a332c]"
                      disabled={isSubmittingInvite}
                    >
                      {isSubmittingInvite
                        ? t("auth.register.submitting")
                        : t("auth.register.submit")}
                    </Button>
                  </Form>
                )}
              </Formik>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
