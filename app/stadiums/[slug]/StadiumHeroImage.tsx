"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
}

export default function StadiumHeroImage({ src, alt }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="w-full"
        style={{
          height: 280,
          background:
            "linear-gradient(135deg, rgba(0,255,135,0.06) 0%, rgba(10,10,10,0) 60%, rgba(59,130,246,0.06) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={1280}
      height={480}
      unoptimized
      priority
      onError={() => setFailed(true)}
      className="w-full object-cover"
      style={{ height: 280, objectPosition: "center 40%" }}
    />
  );
}
