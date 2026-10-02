"use client";

// The local identity badge intentionally makes no request for absent artwork.
// An official asset can be supplied explicitly when one is added to the project.
export function FedoraMark({ className, title = "Fedora", src }: {
  className?: string;
  title?: string;
  src?: string;
}) {
  if (src) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={title} />
  );
  return <span className={className} role="img" aria-label={title} data-placeholder>
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="23" fill="#294172" />
      <circle cx="24" cy="24" r="23" fill="none" stroke="#3c6eb4" strokeWidth="2" />
      <text x="24" y="32" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="19" fontWeight="800" fill="#e8eef7">f</text>
    </svg>
  </span>;
}
