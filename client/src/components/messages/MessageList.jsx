import MessageBubble from "./MessageBubble";

const getDateLabel = (dateString) => {
  const messageDate = new Date(dateString);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  if (isSameDay(messageDate, today)) {
    return "Today";
  }

  if (isSameDay(messageDate, yesterday)) {
    return "Yesterday";
  }

  return messageDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const MessageList = ({
  messages,
  currentUser,
  formatTime,
  onImageClick,
  onToggleReaction,
  onReply,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="messages-container">
      {messages.map((message, index) => {
        const currentDate = getDateLabel(message.createdAt);

        const previousDate =
          index > 0
            ? getDateLabel(messages[index - 1].createdAt)
            : null;

        const showDateSeparator =
          index === 0 || currentDate !== previousDate;

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="message-date-separator">
                <span>{currentDate}</span>
              </div>
            )}

            <MessageBubble
              message={message}
              isOwnMessage={
                message.senderId === currentUser?.id
              }
              formatTime={formatTime}
              onImageClick={onImageClick}
              onToggleReaction={onToggleReaction}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;