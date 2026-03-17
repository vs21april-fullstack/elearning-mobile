import Button from "./Button";
import modalStyles from "./Modal.module.css";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmVariant = "danger",
}) {
  if (!isOpen) return null;

  return (
    <div className={`modal d-block ${modalStyles.modalOverlay}`}>
      <div className={`modal-dialog modal-md ${modalStyles.modalDialog}`}>
        <div
          className={`modal-content glass-card animate-fade-in ${modalStyles.modalContent}`}
        >
          <div className={`modal-header border-0 ${modalStyles.modalHeader}`}>
            <h5 className={`modal-title fw-bold ${modalStyles.modalTitle}`}>
              {title}
            </h5>
            <button
              type="button"
              className={`${modalStyles.closeButton} btn-close btn-close-white`}
              onClick={onCancel}
            ></button>
          </div>

          <div className={modalStyles.modalBody}>
            <p className="mb-0 text-secondary">{message}</p>
          </div>

          <div className={`modal-footer border-0 ${modalStyles.modalFooter}`}>
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
