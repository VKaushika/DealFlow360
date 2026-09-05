import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-cream-darkBorder bg-white/70 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-cream-200 border border-cream-border flex items-center justify-center mb-3 text-charcoal-500">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-charcoal-900">{title}</h4>
      {description && (
        <p className="text-xs text-charcoal-500 max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-charcoal-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-subtle transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
