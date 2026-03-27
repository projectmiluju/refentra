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
    'inline-flex items-center px-2 py-1 rounded-md text-sm font-jetbrains font-medium transition-colors',
    isActive ? 'bg-primary text-sys-text' : 'bg-slate-800 text-slate-200',
    onClick ? 'cursor-pointer hover:border-slate-500 border border-transparent' : '',
    className,
  ].filter(Boolean).join(' ');

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
          className="ml-1.5 focus:outline-none hover:text-slate-400 text-slate-500"
          aria-label={`${label} 태그 삭제`}
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
