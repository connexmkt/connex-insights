import { cn } from "@/lib/utils"

export function ConnexLogo({
  className,
  showText = true,
  textClassName,
}: {
  className?: string
  showText?: boolean
  textClassName?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          className,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
          <path
            d="M4 15.5L8.5 10L12 13.5L19 6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="6" r="2.2" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span className={cn("font-heading text-[15px] font-semibold tracking-tight", textClassName)}>
          Connex Insights
        </span>
      )}
    </div>
  )
}
