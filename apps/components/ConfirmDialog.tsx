
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDestructive ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-700'}`}>
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">
              {title}
            </h3>
            
            <p className="text-sm font-black text-slate-500 leading-relaxed uppercase tracking-tight">
              {message}
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-rose-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-100'}`}
          >
            {confirmLabel}
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
