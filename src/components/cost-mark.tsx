import { COST_LABEL, type CostStatus } from "@/lib/listings/schema";

export function CostMark({ status, label = true }: { status: CostStatus; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="mark" data-status={status} aria-hidden="true" />
      {label ? (
        <span className="font-semibold">{COST_LABEL[status]}</span>
      ) : (
        <span className="sr-only">{COST_LABEL[status]}</span>
      )}
    </span>
  );
}
