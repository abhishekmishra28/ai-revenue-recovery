interface StatusBadgeProps {
  label: string;
  className?: string;
  dot?: boolean;
}

export default function StatusBadge({ label, className = "badge-muted", dot }: StatusBadgeProps) {
  return (
    <span className={`badge ${className}`}>
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "currentColor",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}
