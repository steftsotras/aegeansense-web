import Image from "next/image"

import { cn } from "@/lib/utils"

export function BrandWordmark({
  className,
  imageClassName,
}: {
  className?: string
  imageClassName?: string
}) {
  return (
    <span
      role="img"
      aria-label="AegeanSense"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src="/logo-aegeansense-wordmark.png"
        alt=""
        aria-hidden="true"
        width={2172}
        height={724}
        className={cn("h-auto w-full object-contain object-left", imageClassName)}
        priority
      />
    </span>
  )
}
