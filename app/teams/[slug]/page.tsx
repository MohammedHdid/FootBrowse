import { redirect } from "next/navigation";
import { teams } from "@/lib/data";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return teams.map((t) => ({ slug: t.slug }));
}

// Permanently moved to /leagues/world-cup/teams/[slug]
export default function TeamRedirectPage({ params }: Props) {
  redirect(`/leagues/world-cup/teams/${params.slug}`);
}
