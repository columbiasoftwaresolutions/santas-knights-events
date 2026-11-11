import { cn } from "cn";
import type { ReactNode } from "react";

// Links to pages we do not control. They open in a new tab so the visitor keeps
// their filters, say so for screen readers, and carry no referrer or opener.
export function OutboundLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn("underline underline-offset-4", className)}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
