import { X, Download } from "lucide-react";

const ImageViewer = ({
  imageUrl,
  fileName,
  onClose,
}) => {
  if (!imageUrl) return null;

const handleDownload = async () => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "image";

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed", error);
  }
};

  return (
    <div
      className="image-viewer-overlay"
      onClick={onClose}
    >
      <div
        className="image-viewer-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="image-viewer-close"
          onClick={onClose}
        >
          <X size={28} />
        </button>

        <img
          src={imageUrl}
          alt={fileName || "Image"}
          className="image-viewer-image"
        />

        <button
          className="image-viewer-download"
          onClick={handleDownload}
        >
          <Download size={18} />
          Download
        </button>
      </div>
    </div>
  );
};

export default ImageViewer;