export function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-muted" />
      <span className="text-xs font-medium tracking-wide text-muted-foreground">OR</span>
      <div className="h-px flex-1 bg-muted" />
    </div>
  )
}
