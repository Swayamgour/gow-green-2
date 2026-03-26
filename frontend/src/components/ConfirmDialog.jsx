import React from "react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({ open, onClose, onConfirm, message }) {
  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <h3>Confirm</h3>
        <p>{message || "Are you sure?"}</p>

        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}