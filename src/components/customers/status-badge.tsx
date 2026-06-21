import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    pending: {
      bg: "bg-red-100 dark:bg-red-950/50",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
      label: "Pending",
    },
    paid: {
      bg: "bg-green-100 dark:bg-green-950/50",
      text: "text-green-700 dark:text-green-400",
      dot: "bg-green-500",
      label: "Paid",
    },
    completed: {
      bg: "bg-blue-100 dark:bg-blue-950/50",
      text: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
      label: "Completed",
    },
  };

  const style = config[status as keyof typeof config] || config.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
