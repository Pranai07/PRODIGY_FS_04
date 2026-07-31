import { useEffect, useState } from "react";
import chatWallpapers from "../../constants/chatWallpapers";
import "./ChatWallpaperModal.css";

const ChatWallpaperModal = ({
  isOpen,
  onClose,
  selectedWallpaper,
  onApplyWallpaper,
}) => {
  const [previewWallpaper, setPreviewWallpaper] =
    useState(selectedWallpaper);

  useEffect(() => {
    if (isOpen) {
      setPreviewWallpaper(selectedWallpaper);
    }
  }, [isOpen, selectedWallpaper]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyWallpaper(previewWallpaper);
    onClose();
  };

  return (
    <div
      className="wallpaper-modal-overlay"
      onClick={onClose}
    >
      <div
        className="wallpaper-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wallpaper-modal-header">
          <div>
            <h2>Chat Wallpaper</h2>
            <p>Choose a background for your chats</p>
          </div>

          <button
            type="button"
            className="wallpaper-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="wallpaper-grid">
          {chatWallpapers.map((wallpaper) => {
            const isSelected =
              previewWallpaper === wallpaper.id;

            return (
              <button
                key={wallpaper.id}
                type="button"
                className={`wallpaper-option ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() =>
                  setPreviewWallpaper(wallpaper.id)
                }
              >
                <div
                  className="wallpaper-preview"
                  style={{
                    background: wallpaper.value,
                  }}
                >
                  {isSelected && (
                    <span className="wallpaper-check">
                      ✓
                    </span>
                  )}
                </div>

                <span className="wallpaper-name">
                  {wallpaper.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="wallpaper-actions">
          <button
            type="button"
            className="wallpaper-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="wallpaper-apply-btn"
            onClick={handleApply}
          >
            Apply Wallpaper
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWallpaperModal;