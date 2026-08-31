import { AlertCircle, RefreshCw } from "lucide-react";

interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
}

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const cls = size === "lg" ? "spinner spinner-lg" : "spinner";
  return <div className={cls} />;
}

export default function LoadingState({
  loading,
  error,
  empty,
  emptyMessage = "No data found.",
  onRetry,
}: LoadingStateProps) {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <LoadingSpinner size="lg" />
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Fetching data…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <AlertCircle size={32} color="var(--red)" />
        <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {error}
        </div>
        {onRetry && (
          <button className="btn btn-ghost" onClick={onRetry}>
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <div className="empty-state-text">{emptyMessage}</div>
      </div>
    );
  }

  return null;
}
