import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnOutsideClick?: boolean;
}

export default function Modal({
  open,
  onClose,
  closeOnOutsideClick = true,
  children,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed z-[9999] inset-0 bg-black/60 backdrop-blur-sm transition-colors overflow-y-auto"
      onClick={closeOnOutsideClick ? onClose : () => {}}
    >
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div
          className={`relative bg-white rounded-xl shadow-2xl transition-all
          ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          w-full max-w-7xl
          max-h-[calc(100vh-1rem)] overflow-y-auto
          p-6 sm:p-10
          `}
          onClick={(e) => e.stopPropagation()}
          style={{
            minWidth: '320px',
            maxWidth: '98vw',
            minHeight: '700px'
          }}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 bg-white hover:text-gray-600 hover:bg-gray-100 transition-colors z-10 shadow-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          <div className="pr-12 sm:pr-16 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
