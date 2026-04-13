import Image from "next/image";
import { getFlagUrl } from "@/lib/country-codes";

interface Props {
  nationality: string;
  size?: number;
  className?: string;
}

/**
 * Renders a flag image from flagcdn.com for the given nationality.
 * Falls back to a small text abbreviation if the nationality is unmapped.
 */
export default function FlagImg({ nationality, size = 20, className = "" }: Props) {
  const src = getFlagUrl(nationality, size <= 20 ? 20 : size <= 40 ? 40 : 80);

  if (!src) {
    return (
      <span className={`text-xs text-zinc-500 ${className}`} title={nationality}>
        🌍
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={`${nationality} flag`}
      title={nationality}
      width={size}
      height={Math.round(size * 0.67)}
      className={`inline-block rounded-sm object-cover align-middle ${className}`}
      style={{ width: size, height: "auto" }}
    />
  );
}
