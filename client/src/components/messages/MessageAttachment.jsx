import { FileText, Download } from "lucide-react";

const MessageAttachment = ({
  message,
  formatFileSize,
  setViewerImage,
  setViewerFileName,
}) => {
  if (
    message.messageType === "image" &&
    message.fileUrl
  ) {
    return (
      <div
        className="chat-image-link"
        onClick={() => {
          setViewerImage(message.fileUrl);
          setViewerFileName(message.fileName);
        }}
      >
        <img
          src={message.fileUrl}
          alt={message.fileName || "Shared image"}
          className="chat-message-image"
        />
      </div>
    );
  }

  if (
    message.messageType === "file" &&
    message.fileUrl
  ) {
    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="chat-file-card"
      >
        <div className="chat-file-icon">
          <FileText size={23} />
        </div>

        <div className="chat-file-info">
          <strong>
            {message.fileName ||
              "Attachment"}
          </strong>

          <span>
            {formatFileSize(
              message.fileSize
            )}
          </span>
        </div>

        <Download size={18} />
      </a>
    );
  }

  return null;
};

export default MessageAttachment;