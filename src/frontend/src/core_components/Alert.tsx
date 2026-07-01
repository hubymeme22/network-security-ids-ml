import { AlertCircle } from 'lucide-react';

interface AlertProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  className?: string;
}

export default function Alert({ message, type = 'error', className = '' }: AlertProps) {
  let colorClass = '';

  switch (type) {
    case 'success':
      colorClass = 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald';
      break;
    case 'warning':
      colorClass = 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber';
      break;
    case 'info':
      colorClass = 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan';
      break;
    case 'error':
    default:
      colorClass = 'border-accent-rose/30 bg-accent-rose/10 text-accent-rose';
      break;
  }

  return (
    <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${colorClass} ${className}`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
