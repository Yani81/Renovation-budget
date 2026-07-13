import type { ReactNode } from 'react';

export default function Modal({
  title, kind, onClose, children,
}: {
  title: string;
  kind: 'expense' | 'budget' | 'project';
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header h-${kind}`}>{title}</div>
        {children}
      </div>
    </div>
  );
}
