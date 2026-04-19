import { redirect } from "next/navigation";
import { teams } from "@/lib/data";

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

// Permanently moved to /leagues/world-cup/teams/[slug]
export default function TeamRedirectPage({ params }: Props) {
  redirect(`/leagues/world-cup/teams/${params.slug}`);
}
