import React from 'react';

export type StatusVariant =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REVISION_REQUESTED'
  | 'CUSTOMER_CONFIRMED'
  | 'FULFILLMENT'
  | 'READY_FOR_FULFILLMENT'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'BILLING'
  | 'CLOSED'
  | 'REJECTED'
  | 'PENDING'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'UNBILLED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'ACTIVE'
  | 'CANCELLED'
  | 'PLATINUM'
  | 'GOLD'
  | 'SILVER'
  | 'STANDARD'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
}) => {
  const normalized = (status || '').toUpperCase();

  let styles = 'bg-cream-200 text-charcoal-700 border-cream-darkBorder';
  let dotColor = 'bg-charcoal-500';

  switch (normalized) {
    case 'APPROVED':
    case 'FULFILLED':
    case 'PAID':
    case 'CUSTOMER_CONFIRMED':
    case 'CLOSED':
    case 'ACTIVE':
    case 'LOW':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;

    case 'PENDING_APPROVAL':
    case 'PENDING':
    case 'REVISION_REQUESTED':
    case 'MEDIUM':
    case 'PARTIALLY_FULFILLED':
    case 'PARTIALLY_PAID':
    case 'READY_FOR_FULFILLMENT':
    case 'SUBMITTED':
      styles = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;

    case 'REJECTED':
    case 'CRITICAL':
    case 'OVERDUE':
    case 'CANCELLED':
      styles = 'bg-rose-50 text-rose-800 border-rose-200';
      dotColor = 'bg-rose-500';
      break;

    case 'HIGH':
      styles = 'bg-orange-50 text-orange-800 border-orange-200';
      dotColor = 'bg-orange-500';
      break;

    case 'DRAFT':
    case 'UNBILLED':
      styles = 'bg-cream-200 text-charcoal-600 border-cream-border';
      dotColor = 'bg-charcoal-400';
      break;

    case 'PLATINUM':
      styles = 'bg-purple-50 text-purple-800 border-purple-200';
      dotColor = 'bg-purple-500';
      break;

    case 'GOLD':
      styles = 'bg-amber-50 text-amber-900 border-amber-300';
      dotColor = 'bg-amber-500';
      break;

    case 'SILVER':
      styles = 'bg-slate-100 text-slate-800 border-slate-300';
      dotColor = 'bg-slate-400';
      break;

    default:
      styles = 'bg-cream-200 text-charcoal-700 border-cream-darkBorder';
      dotColor = 'bg-charcoal-500';
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  }[size];

  const formattedText = normalized.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap tracking-tight ${sizeClasses} ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{formattedText}</span>
    </span>
  );
};
