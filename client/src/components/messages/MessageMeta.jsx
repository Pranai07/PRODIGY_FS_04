const MessageMeta = ({
  message,
  formatTime,
  isOwnMessage,
}) => {
  return (
    <div className="message-meta">
      <span>
        {formatTime(message.createdAt)}
      </span>

      {isOwnMessage && (
        <span className="delivery-status">
          {message.readAt
            ? "✓✓"
            : message.deliveredAt
            ? "✓✓"
            : "✓"}
        </span>
      )}
    </div>
  );
};

export default MessageMeta;