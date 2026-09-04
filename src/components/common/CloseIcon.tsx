export default function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current stroke-[2.4] ${className}`} aria-hidden="true">
      <path d="M6.5 6.5 17.5 17.5" strokeLinecap="round" />
      <path d="M17.5 6.5 6.5 17.5" strokeLinecap="round" />
    </svg>
  );
}
