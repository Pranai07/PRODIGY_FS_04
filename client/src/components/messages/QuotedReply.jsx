const QuotedReply = ({
  replyTo,
  scrollToOriginalMessage,
}) => {
  if (!replyTo) return null;

  return (
    <div
      className="quoted-reply"
      onClick={() =>
        scrollToOriginalMessage(replyTo.id)
      }
      role="button"
      tabIndex={0}
      title="Jump to original message"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          scrollToOriginalMessage(replyTo.id);
        }
      }}
    >
      <span className="quoted-reply-sender">
        ↩ {replyTo.sender?.name || "User"}
      </span>

      <span className="quoted-reply-content">
        {replyTo.isDeleted
          ? "🚫 This message was deleted"
          : replyTo.messageType === "image"
          ? "📷 Photo"
          : replyTo.messageType === "file"
          ? `📎 ${replyTo.fileName || "Attachment"}`
          : replyTo.content}
      </span>
    </div>
  );
};

export default QuotedReply;