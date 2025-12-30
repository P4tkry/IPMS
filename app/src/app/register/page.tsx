"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Fraunces } from "next/font/google";

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
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.string().required("Imie i nazwisko jest wymagane."),
        email: Yup.string().email("Podaj poprawny email.").required("Email jest wymagany."),
        password: Yup.string().min(8, "Haslo musi miec min 8 znakow.").required("Haslo jest wymagane."),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password")], "Hasla musza byc takie same.")
          .required("Potwierdz haslo."),
      }),
    [],
  );

  useEffect(() => {
    if (!token) {
      setError("Brak tokenu zaproszenia.");
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
          setError(payload?.message || "Nieprawidlowe zaproszenie.");
          return;
        }
        setInvite(payload?.invite || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nieprawidlowe zaproszenie.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4ef] px-6 text-[#2a241f]">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f1d9bf] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#dfe7c6] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#b9a38c_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center py-20">
        <Card className="w-full border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
                Registration
              </Badge>
              <h1
                className={`${fraunces.className} text-balance text-3xl font-semibold leading-tight tracking-tight`}
              >
                Utworz konto w IPMS
              </h1>
              <p className="text-sm text-[#6f6255]">
                Dokoncz rejestracje na podstawie zaproszenia.
              </p>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#6f6255]">Ladowanie zaproszenia...</p>
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
                      setError(payload?.message || "Nie udalo sie utworzyc konta.");
                      return;
                    }
                    router.replace("/login");
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : "Nie udalo sie utworzyc konta.";
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
                        Imie i nazwisko
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
                        Email
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
                        Haslo
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
                        Potwierdz haslo
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
                      {isSubmittingInvite ? "Tworzenie konta..." : "Utworz konto"}
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
