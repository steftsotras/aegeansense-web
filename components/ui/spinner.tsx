import { LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-12",
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Φόρτωση..."
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Spinner }