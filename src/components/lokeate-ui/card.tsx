import * as React from "react";

export function LokeateCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-3xl border border-[#e9ebe7] shadow-[0_5px_22px_rgba(26,28,23,0.06)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function LokeateCardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 pb-4 ${className}`}>{children}</div>;
}

export function LokeateCardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>;
}

export function LokeateCardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-t border-[#e9ebe7] bg-[#fbfbfa] ${className}`}>
      {children}
    </div>
  );
}
