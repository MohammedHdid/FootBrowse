"use client"
import { useState } from "react"

interface Props {
  src: string
  alt: string
  width?: number
}

export default function MatchFlagImg({ src, alt, width = 22 }: Props) {
  const [imgSrc, setImgSrc] = useState(src || "/badge-tbd.svg")

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={Math.round(width * (15 / 22))}
      onError={() => setImgSrc("/badge-tbd.svg")}
      className="rounded-sm object-cover shrink-0"
      style={{ width, height: "auto" }}
    />
  )
}
