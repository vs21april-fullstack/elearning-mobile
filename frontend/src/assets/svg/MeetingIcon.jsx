export default function MeetingIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M8 3V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="2" fill={color} />
    </svg>
  );
}
