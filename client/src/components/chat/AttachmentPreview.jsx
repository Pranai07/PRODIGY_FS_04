import { FileText, X } from "lucide-react";

const AttachmentPreview = ({
  selectedFile,
  imagePreviewUrl,
  uploadingFile,
  onRemove,
  formatFileSize,
}) => {
  if (!selectedFile) {
    return null;
  }

  return (
    <div className="selected-attachment">
      <div className="selected-attachment-info">
        {selectedFile.type.startsWith("image/") &&
        imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt="Selected attachment"
            className="selected-image-preview"
          />
        ) : (
          <div className="selected-file-icon">
            <FileText size={22} />
          </div>
        )}

        <div>
          <strong>{selectedFile.name}</strong>

          <span>
            {formatFileSize(selectedFile.size)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={uploadingFile}
        title="Remove attachment"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default AttachmentPreview;