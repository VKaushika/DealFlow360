import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  color?: 'orange' | 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'dark' | string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg,
  iconColor,
  color,
  trend,
  onClick,
  className = '',
  badge,
}) => {
  // Preset color mappings for screenshot-matching pastel accent icons
  let resolvedBg = iconBg || 'bg-orange-100/70';
  let resolvedColor = iconColor || 'text-brand-600';

  if (color) {
    switch (color) {
      case 'orange':
      case 'amber':
        resolvedBg = 'bg-orange-100';
        resolvedColor = 'text-brand-600';
        break;
      case 'emerald':
        resolvedBg = 'bg-emerald-100';
        resolvedColor = 'text-emerald-700';
        break;
      case 'blue':
        resolvedBg = 'bg-blue-100';
        resolvedColor = 'text-blue-700';
        break;
      case 'purple':
        resolvedBg = 'bg-purple-100';
        resolvedColor = 'text-purple-700';
        break;
      case 'rose':
        resolvedBg = 'bg-rose-100';
        resolvedColor = 'text-rose-700';
        break;
      case 'dark':
        resolvedBg = 'bg-charcoal-900';
        resolvedColor = 'text-white';
        break;
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-cream-border hover:border-cream-darkBorder rounded-2xl p-5 transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:shadow-card group'
          : 'shadow-subtle'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-charcoal-600 tracking-tight truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="text-[10px] font-bold bg-brand-50 text-brand-800 px-2.5 py-0.5 rounded-full border border-brand-200">
              {badge}
            </span>
          )}
          {Icon && (
            <div className={`w-9 h-9 rounded-xl ${resolvedBg} flex items-center justify-center ${resolvedColor} transition-transform group-hover:scale-105`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-black text-charcoal-900 font-mono tracking-tight tabular-nums">
          {value}
        </span>
      </div>

      {(subtext || trend) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-charcoal-500 font-medium">
          {trend && (
            <span
              className={`font-bold ${
                trend.isNeutral
                  ? 'text-charcoal-500'
                  : trend.isPositive
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-charcoal-500 truncate text-[11px] font-normal">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
