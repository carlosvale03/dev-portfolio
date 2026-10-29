import { notFound } from "next/navigation";
import { getContent, hasLang } from "@/content";
import { Experience } from "@/components/shell/Experience";
import { SeriousMain } from "@/components/serious/SeriousMain";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const content = getContent(lang);

  return (
    <Experience content={content}>
      <SeriousMain content={content} />
    </Experience>
  );
}
