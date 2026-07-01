import { AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
}

export default function Toast({ message, type = 'info' }: ToastProps) {
  let colorClass = '';
  
  switch (type) {
    case 'success':
      colorClass = 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald';
      break;
    case 'error':
      colorClass = 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose';
      break;
    case 'info':
    default:
      colorClass = 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan';
      break;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl border flex items-center gap-3 animate-pulse-slow max-w-sm transition-all duration-300 ${colorClass}`}>
      <AlertCircle className="w-5 h-5 shrink-0" />
      <span className="text-xs font-semibold">{message}</span>
    </div>
  );
}
