// Purely decorative, very-low-opacity background icons for each result card.
export function ThyroidIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M40 40 C30 25, 12 25, 10 40 C12 55, 30 55, 40 40 Z" />
      <path d="M40 40 C50 25, 68 25, 70 40 C68 55, 50 55, 40 40 Z" />
      <circle cx="40" cy="40" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BrainIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M25 55 C15 50, 12 35, 20 24 C26 14, 42 12, 52 20 C62 26, 66 38, 60 48 C64 52, 62 60, 55 60 L52 66 L44 66 L42 60 C36 62, 29 60, 25 55 Z" />
      <path d="M30 30 C34 28, 38 30, 38 34" />
      <path d="M40 26 C44 30, 44 36, 40 40" />
    </svg>
  );
}

export function MoleculeIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="40,12 62,26 62,54 40,68 18,54 18,26" />
      <circle cx="40" cy="12" r="4" fill="currentColor" stroke="none" />
      <circle cx="62" cy="26" r="4" fill="currentColor" stroke="none" />
      <circle cx="62" cy="54" r="4" fill="currentColor" stroke="none" />
      <circle cx="40" cy="68" r="4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="54" r="4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="26" r="4" fill="currentColor" stroke="none" />
      <line x1="40" y1="12" x2="40" y2="68" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="14" y="18" width="52" height="46" rx="4" />
      <line x1="14" y1="30" x2="66" y2="30" />
      <line x1="26" y1="10" x2="26" y2="22" />
      <line x1="54" y1="10" x2="54" y2="22" />
      <circle cx="26" cy="42" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="40" cy="42" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="54" cy="42" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="26" cy="52" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="40" cy="52" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
