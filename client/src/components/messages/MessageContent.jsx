const MessageContent = ({
  message,
  onImageClick,
}) => {
  if (message.isDeleted) {
    return null;
  }

  switch (message.messageType) {
    case "image":
      return (
        <div className="message-image-container">
          <img
            src={message.fileUrl}
            alt={message.fileName || "Image"}
            className="message-image"
            onClick={() =>
              onImageClick(message.fileUrl)
            }
          />
        </div>
      );

    case "file":
      return (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="message-file"
        >
          📎 {message.fileName || "Attachment"}
        </a>
      );

    default:
      return (
        <p className="message-text">
          {message.content}
        </p>
      );
  }
};

export default MessageContent;