import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
  placeholder?: string;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ isError = false, className = '', ...props }, ref) => {
    
    const baseStyle = 'w-full px-4 py-2 bg-surface text-sys-text font-pretendard rounded-lg border outline-none transition-colors';
    const borderStyle = isError 
      ? 'border-error focus:border-error'
      : 'border-slate-700 focus:border-primary';

    const combinedClassName = [
      baseStyle,
      borderStyle,
      'placeholder-text-muted focus:ring-1 focus:ring-primary',
      className
    ].filter(Boolean).join(' ');

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
