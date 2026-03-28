import React from 'react';

export interface TagBadgeProps {
  label: string;
  onRemove?: () => void;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const TagBadge: React.FC<TagBadgeProps> = ({ 
  label, 
  onRemove,
  className = '',
  isActive = false,
  onClick,
}) => {
  const containerClassName = [
    'inline-flex min-h-[40px] min-w-[72px] items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-jetbrains font-medium uppercase tracking-[0.08em] transition-colors',
    isActive
      ? 'border-primary bg-primary text-white'
      : 'border-border/70 bg-surface text-sys-text',
    onClick ? 'cursor-pointer hover:bg-surface-soft' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={containerClassName}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? isActive : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <span className="text-nowrap">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-text-muted focus:outline-none hover:text-sys-text"
          aria-label={`Remove ${label} tag`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </span>
  );
};

export default TagBadge;
