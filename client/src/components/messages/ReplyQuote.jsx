const ReplyQuote = ({ replyTo }) => {
  if (!replyTo) return null;

  return (
    <div className="reply-reference">
      <strong>
        {replyTo.sender?.name || "User"}
      </strong>

      <span>
        {replyTo.isDeleted
          ? "This message was deleted"
          : replyTo.messageType === "image"
          ? "📷 Photo"
          : replyTo.messageType === "file"
          ? `📎 ${replyTo.fileName || "Attachment"}`
          : replyTo.content}
      </span>
    </div>
  );
};

export default ReplyQuote;