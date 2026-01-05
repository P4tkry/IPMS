import Link from "next/link";
import { getServerI18n } from "@/i18n/server";
import {
  buildManifestAspects,
  manifestAspectSlugs,
} from "@/app/project/create/_components/manifest-aspects";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const renderList = (items?: string[]) => {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#2b3c4d]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export default async function ManifestAspectPage({ params }: PageProps) {
  const { slug } = await params;
  const { t } = await getServerI18n();
  const aspects = buildManifestAspects(t);
  const aspect = aspects.find((item) => item.slug === slug);

  if (!aspect) {
    return (
      <div className="min-h-screen bg-[#f6efe8] px-6 py-12 text-[#2a241f]">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header className="rounded-3xl border border-[#eadfd3] bg-white p-8 shadow-[0_24px_70px_-45px_rgba(40,30,20,0.5)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
              {t("project.create.expert.label")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Aspect not found</h1>
            <p className="mt-2 text-sm text-[#5b5044]">{slug}</p>
          </header>
          <section className="rounded-3xl border border-[#eadfd3] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
              Available aspects
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {manifestAspectSlugs.map((slug) => (
                <Link
                  key={slug}
                  href={`/manifest/aspect/${slug}`}
                  className="rounded-2xl border border-[#d7c8b7] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2a241f] transition hover:border-[#2a241f]"
                >
                  {slug}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe8] px-6 py-12 text-[#2a241f]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="rounded-3xl border border-[#eadfd3] bg-white p-8 shadow-[0_24px_70px_-45px_rgba(40,30,20,0.5)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
            {t("project.create.expert.label")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold">{aspect.title}</h1>
          <p className="mt-2 text-sm text-[#5b5044]">{aspect.question}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
              {aspect.slug}
            </span>
          </div>
        </header>

        <section className="rounded-3xl border border-[#d8e5f0] bg-[#f3f8ff] p-8 text-[#2b3c4d] shadow-[0_20px_60px_-42px_rgba(37,68,106,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
            {t("project.create.expert.label")}
          </p>

          {aspect.expert.paragraphs?.map((text) => (
            <p key={text} className="mt-4 text-sm leading-relaxed text-[#2b3c4d]">
              {text}
            </p>
          ))}

          {aspect.expert.callouts?.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {aspect.expert.callouts.map((callout) => (
                <div
                  key={callout.label}
                  className="rounded-2xl border border-[#d5e1f1] bg-[#eaf2ff] px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#35506a]">
                    {callout.label}
                  </p>
                  <p className="mt-2 text-sm text-[#2b3c4d]">{callout.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {renderList(aspect.expert.bullets)}

          {aspect.expert.exampleTexts?.length ? (
            <div className="mt-6 grid gap-4">
              {aspect.expert.exampleTexts.map((example) => (
                <div
                  key={example.title}
                  className="rounded-2xl border border-[#e7dccf] bg-white px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2b3c4d]">
                    {example.title}
                  </p>
                  <p className="mt-2 text-sm text-[#2b3c4d]">{example.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {aspect.expert.examples?.map((example) => (
            <div key={example.title} className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2b3c4d]">
                {example.title}
              </p>
              {renderList(example.items)}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return manifestAspectSlugs.map((slug) => ({ slug }));
}
