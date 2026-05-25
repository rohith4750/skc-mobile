export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  
  // Timezone-safe local formatting
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderDate(order: any): string | Date {
  if (!order) return new Date();
  return order.eventDate || order.createdAt;
}

export function sanitizeMealLabel(label: string): string {
  if (!label) return "";

  let workingLabel = String(label);

  // If it's a long string with hyphens (likely a UUID), return generic label
  if (workingLabel.length > 20 && workingLabel.includes("-")) return "Meal";

  if (workingLabel === "special_order") return "Special Order";

  // Strip tracking suffixes like session_NAME_serial
  if (workingLabel.startsWith("session_")) {
    const parts = workingLabel.split("_");
    if (parts.length > 1 && parts[1] !== "merged") {
      workingLabel = parts[1];
    } else {
      workingLabel = "Meal";
    }
  }

  // Handle merged suffixes
  if (workingLabel.toLowerCase().includes("_merged")) {
    workingLabel = workingLabel.split("_")[0];
  }

  const cleanLabel = workingLabel.split("_")[0];
  // If still too long, it's likely a technical ID
  if (cleanLabel.length > 20) return "Meal";

  // Capitalize for consistent display
  return cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1).toLowerCase();
}
