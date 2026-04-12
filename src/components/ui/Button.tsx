import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-[#22d3ee] text-[#0a0a0f] font-semibold hover:bg-[#06b6d4] active:scale-[0.97]',
  secondary: 'bg-[#1a1a24] text-[#f0f0f5] border border-[#2a2a3a] hover:bg-[#222230] active:scale-[0.97]',
  ghost: 'bg-transparent text-[#8888a0] hover:text-[#f0f0f5] hover:bg-[#1a1a24]',
  danger: 'bg-[#f43f5e] text-white font-semibold hover:bg-[#e11d48] active:scale-[0.97]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-3 text-base rounded-xl',
  lg: 'px-6 py-4 text-lg rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150
        ${variants[variant]} ${sizes[size]} ${className}
        disabled:opacity-40 disabled:pointer-events-none`}
      {...props}
    >
      {children}
    </button>
  );
}
