import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
  placeholder?: string;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ isError = false, className = '', ...props }, ref) => {
    const baseStyle = 'w-full min-h-[48px] rounded-md border bg-surface px-4 py-3 font-pretendard text-sys-text outline-none transition-colors';
    const borderStyle = isError
      ? 'border-error focus:border-error'
      : 'border-border/40 focus:border-primary';

    const combinedClassName = [
      baseStyle,
      borderStyle,
      'placeholder:text-text-muted focus:ring-1 focus:ring-primary/20 disabled:bg-surface-soft disabled:text-text-muted',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <input
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
