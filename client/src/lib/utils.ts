export function formatCurrency(amount: string | number | undefined, currency = "INR"): string {
  if (amount === undefined || amount === null) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

export function shortId(id: string): string {
  return id.slice(0, 8) + "…";
}

export function truncate(str: string, len = 40): string {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function confidencePct(conf: string | number): string {
  const num = typeof conf === "string" ? parseFloat(conf) : conf;
  return `${Math.round(num * 100)}%`;
}

// Status → badge class
export function caseStatusBadge(status: string): string {
  switch (status) {
    case "OPEN":        return "badge-blue";
    case "IN_PROGRESS": return "badge-orange";
    case "RECOVERED":   return "badge-green";
    case "FAILED":      return "badge-red";
    case "CLOSED":      return "badge-muted";
    default:            return "badge-muted";
  }
}

export function priorityBadge(priority: string): string {
  switch (priority) {
    case "CRITICAL": return "badge-red";
    case "HIGH":     return "badge-orange";
    case "MEDIUM":   return "badge-gold";
    case "LOW":      return "badge-muted";
    default:         return "badge-muted";
  }
}

export function riskBadge(risk: string): string {
  switch (risk) {
    case "HIGH":   return "badge-red";
    case "MEDIUM": return "badge-gold";
    case "LOW":    return "badge-green";
    default:       return "badge-muted";
  }
}

export function decisionBadge(status: string): string {
  switch (status) {
    case "VALIDATED": return "badge-green";
    case "REJECTED":  return "badge-red";
    case "GENERATED": return "badge-gold";
    default:          return "badge-muted";
  }
}

export function actionStatusBadge(status: string): string {
  switch (status) {
    case "SUCCEEDED": return "badge-green";
    case "FAILED":    return "badge-red";
    case "EXECUTING": return "badge-orange";
    case "PENDING":   return "badge-blue";
    case "VALIDATED": return "badge-gold";
    case "REJECTED":  return "badge-red";
    case "SKIPPED":   return "badge-muted";
    default:          return "badge-muted";
  }
}

export function outcomeBadge(status: string): string {
  switch (status) {
    case "SUCCESS":         return "badge-green";
    case "PARTIAL_SUCCESS": return "badge-gold";
    case "FAILED":          return "badge-red";
    case "NO_CHANGE":       return "badge-muted";
    default:                return "badge-muted";
  }
}

export function eventTypeBadge(type: string): string {
  switch (type) {
    case "PAYMENT_FAILED":             return "badge-red";
    case "PAYMENT_SUCCEEDED":          return "badge-green";
    case "CHECKOUT_ABANDONED":         return "badge-orange";
    case "SUBSCRIPTION_PAYMENT_FAILED": return "badge-red";
    case "SUBSCRIPTION_RENEWED":       return "badge-green";
    default:                           return "badge-muted";
  }
}

export function actorBadge(actor: string): string {
  switch (actor) {
    case "AI":       return "badge-purple";
    case "SYSTEM":   return "badge-blue";
    case "MERCHANT": return "badge-gold";
    case "ADMIN":    return "badge-orange";
    default:         return "badge-muted";
  }
}

export function txStatusBadge(status: string): string {
  switch (status) {
    case "SUCCEEDED": return "badge-green";
    case "FAILED":    return "badge-red";
    case "PENDING":   return "badge-gold";
    case "CANCELLED": return "badge-muted";
    case "REFUNDED":  return "badge-orange";
    default:          return "badge-muted";
  }
}

export function formatEventType(type: string): string {
  return type.replace(/_/g, " ");
}

export function formatDecision(decision: string): string {
  return decision.replace(/_/g, " ");
}
