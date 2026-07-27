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
        <linearGradient id="vippsStarterLogo" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ff7a45" />
          <stop offset="1" stopColor="#ff5b24" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#vippsStarterLogo)" />
      <path
        d="M136 166 256 354 376 166"
        fill="none"
        stroke="#fff"
        strokeWidth="70"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
