import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Delete' }) => (
  <Modal open={open} onClose={onClose} className="max-w-sm">
    <div className="text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 mb-4">
        <FaExclamationTriangle size={20} />
      </span>
      <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-ink-800/60 dark:text-white/60 mb-6">{description}</p>}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="danger" className="flex-1" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
