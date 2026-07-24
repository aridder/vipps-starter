// Generic starter logo: a rounded mark in an indigo gradient.
// Replace with your product's mark.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="appLogoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#appLogoGrad)" />
      <circle cx="256" cy="256" r="120" fill="#ffffff" opacity="0.95" />
      <circle cx="256" cy="256" r="60" fill="url(#appLogoGrad)" />
    </svg>
  );
}
