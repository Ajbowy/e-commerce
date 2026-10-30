export function ProductPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-muted ${className ?? ""}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-1/3 w-1/3 text-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="10" y="10" width="80" height="80" />
        <path d="M50 26 L74 50 L50 74 L26 50 Z" />
      </svg>
    </div>
  );
}
