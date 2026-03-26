import React from 'react';

export interface TagBadgeProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({ 
  label, 
  onRemove,
  className = '' 
}) => {
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-sm font-jetbrains font-medium ${className}`}
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
