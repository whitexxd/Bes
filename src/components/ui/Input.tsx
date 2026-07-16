import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const baseInput =
  'w-full rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 placeholder-gray-500 px-4 py-2.5 text-sm transition-colors focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${baseInput} ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${baseInput} resize-none ${className}`} {...rest} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
      {children}
    </label>
  );
}
