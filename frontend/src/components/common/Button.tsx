import React from 'react';

type ButtonVariant = 'primary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-pretendard transition-colors min-w-[80px] rounded-lg';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary: 'bg-primary text-sys-text hover:bg-blue-600 active:bg-blue-700',
    ghost: 'bg-transparent text-text-muted hover:text-sys-text active:text-sys-text',
  };

  const disabledStyles = 'disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed opacity-50 cursor-not-allowed';

  const combinedClassName = [
    baseStyle,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth ? 'w-full' : '',
    disabled || isLoading ? disabledStyles : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-sys-text border-t-transparent"></span>
      ) : null}
      <span className="text-body-ko text-nowrap">{children}</span>
    </button>
  );
};

export default Button;
