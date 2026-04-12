import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
}

export function Card({ children, glow = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-4
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
