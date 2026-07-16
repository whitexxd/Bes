import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-emerald-500 text-gray-950 hover:bg-emerald-400 active:bg-emerald-600 shadow-lg shadow-emerald-500/20',
  secondary: 'bg-gray-800 text-gray-100 hover:bg-gray-700 active:bg-gray-900 border border-gray-700',
  ghost: 'text-gray-300 hover:bg-gray-800 hover:text-gray-100',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 active:bg-red-600',
  outline: 'border border-gray-600 text-gray-200 hover:bg-gray-800 hover:border-gray-500',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      className={`font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
