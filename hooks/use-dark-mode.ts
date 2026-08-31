import { useTheme } from "next-themes"
import * as React from "react"

/**
 * Hook to detect if dark mode is active
 * Uses next-themes useTheme hook for reliable theme detection
 */
export function useDarkMode(): boolean {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Handle hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Use resolvedTheme if available (accounts for system preference)
  // Otherwise fall back to theme
  // resolvedTheme will be 'dark' or 'light', never 'system'
  const isDark = React.useMemo(() => {
    if (!mounted) return false // Default to light during SSR
    
    const activeTheme = resolvedTheme || theme
    return activeTheme === "dark"
  }, [theme, resolvedTheme, mounted])

  return isDark
}
