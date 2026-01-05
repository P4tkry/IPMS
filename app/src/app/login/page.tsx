"use client";

import { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Fraunces } from "next/font/google";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const { data: session } = authClient.useSession();

  const getErrorMessage = (err: unknown) => {
    if (!err) return t("auth.login.errorGeneric");
    const anyErr = err as {
      message?: string;
      data?: { message?: string };
      response?: { data?: { message?: string } };
    };
    return (
      anyErr.response?.data?.message ||
      anyErr.data?.message ||
      anyErr.message ||
      t("auth.login.errorGeneric")
    );
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t("auth.validation.emailInvalid"))
      .required(t("auth.validation.emailRequired")),
    password: Yup.string().required(t("auth.validation.passwordRequired")),
  });

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session?.user]);

  return (
    <div className="relative min-h-screen px-6 text-[#2a241f]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center py-20">
        <Card className="w-full border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
                {t("auth.login.badge")}
              </Badge>
              <h1
                className={`${fraunces.className} text-balance text-3xl font-semibold leading-tight tracking-tight`}
              >
                {t("auth.login.title")}
              </h1>
              <p className="text-sm text-[#6f6255]">{t("auth.login.subtitle")}</p>
            </div>
            <div className="rounded-lg border border-[#eadfd3] bg-[#f8f4ef] px-3 py-2 text-xs text-[#6f6255]">
              {t("auth.login.notice")}
            </div>

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={async (values) => {
                setError(null);
                setIsLoading(true);
                try {
                  const result = await authClient.signIn.email({
                    email: values.email,
                    password: values.password,
                  });
                  const anyResult = result as { error?: { message?: string } | null };
                  if (anyResult?.error) {
                    setError(getErrorMessage(anyResult.error));
                    return;
                  }
                  router.push("/dashboard");
                } catch (err) {
                  setError(getErrorMessage(err));
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium" htmlFor="email">
                      {t("auth.fields.email")}
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      className="mt-2 w-full rounded-lg border border-[#d7c8b7] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a241f]"
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

                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full bg-[#2a241f] text-[#f6efe8] hover:bg-[#3a332c]"
                    disabled={isSubmitting || isLoading}
                  >
                    {isLoading ? t("auth.login.submitting") : t("auth.login.submit")}
                  </Button>
                </Form>
              )}
            </Formik>

            <div className="mt-5 text-xs text-[#7a6a5c]">{t("auth.login.help")}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
