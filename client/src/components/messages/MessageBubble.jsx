import { Check, CheckCheck } from "lucide-react";

import MessageEditor from "./MessageEditor";
import QuotedReply from "./QuotedReply";
import MessageAttachment from "./MessageAttachment";
import MessageMenu from "./MessageMenu";
import ReactionPicker from "./ReactionPicker";
import ReactionList from "./ReactionList";

const MessageBubble = ({
  message,
  user,
  chatMode,

  editingMessageId,
  editingContent,
  setEditingContent,
  handleSaveEdit,
  handleCancelEdit,

  showMessageSearch,
  messageSearchQuery,
  highlightSearchText,

  formatTime,
  formatFileSize,
  scrollToOriginalMessage,

  openMessageMenu,
  setOpenMessageMenu,

  openReactionPicker,
  setOpenReactionPicker,

  handleReaction,
  handleStartReply,
  handleStartEdit,
  handleDeleteMessage,

  REACTION_OPTIONS,

  viewerImage,
  setViewerImage,
  viewerFileName,
  setViewerFileName,
}) => {
  const mine = message.senderId === user.id;

  const groupedReactions = (message.reactions || []).reduce(
    (groups, reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }

      groups[reaction.emoji].push(reaction);

      return groups;
    },
    {}
  );

  return (
    <div
      id={`message-${message.id}`}
      className={`message-row ${mine ? "mine" : "theirs"}`}
    >
      <div className="message-content-wrapper">
        {chatMode === "room" && !mine && (
          <span className="message-sender-name">
            {message.sender?.name || "User"}
          </span>
        )}

        <div className="message-bubble">
          {message.isDeleted ? (
            <div className="deleted-message">
              <span className="deleted-message-icon">
                🚫
              </span>

              <span>
                This message was deleted
              </span>
            </div>
          ) : (
            <>
              {/* QUOTED REPLY */}

              <QuotedReply
                replyTo={message.replyTo}
                scrollToOriginalMessage={
                  scrollToOriginalMessage
                }
              />

              {message.messageType === "image" && (
                <MessageAttachment
                  message={message}
                  formatFileSize={formatFileSize}
                  setViewerImage={setViewerImage}
                  setViewerFileName={setViewerFileName}
                />
              )}

              {message.messageType === "file" && (
                <MessageAttachment
                  message={message}
                  formatFileSize={formatFileSize}
                  setViewerImage={setViewerImage}
                  setViewerFileName={setViewerFileName}
                />
              )}

              {message.messageType === "text" && (
                <>
                  {editingMessageId ===
                  message.id ? (
                    <MessageEditor
                      editingContent={
                        editingContent
                      }
                      setEditingContent={
                        setEditingContent
                      }
                      handleSaveEdit={
                        handleSaveEdit
                      }
                      handleCancelEdit={
                        handleCancelEdit
                      }
                      messageId={message.id}
                    />
                  ) : (
                    <>
                      <p className="message-text">
                        {showMessageSearch &&
                        messageSearchQuery.trim()
                          ? highlightSearchText(
                              message.content,messageSearchQuery
                            )
                          : message.content}
                      </p>

                      {message.isEdited && (
                        <span className="message-edited-label">
                          (edited)
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="message-meta">
            <span className="message-time">
              {formatTime(
                message.createdAt
              )}
            </span>

            {/* PRIVATE MESSAGE DELIVERY STATUS */}

            {mine &&
              chatMode === "private" && (
                <span
                  className={`message-status ${
                    message.isRead
                      ? "read"
                      : message.isDelivered
                      ? "delivered"
                      : "sent"
                  }`}
                  title={
                    message.isRead
                      ? "Read"
                      : message.isDelivered
                      ? "Delivered"
                      : "Sent"
                  }
                >
                  {message.isRead ||
                  message.isDelivered ? (
                    <CheckCheck size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                </span>
              )}
          </div>
        </div>

        {/* MESSAGE ACTIONS */}

        {!message.isDeleted && (
          <div className="message-actions">
            <ReactionPicker
              messageId={message.id}
              openReactionPicker={openReactionPicker}
              setOpenReactionPicker={setOpenReactionPicker}
              setOpenMessageMenu={setOpenMessageMenu}
              handleReaction={handleReaction}
              REACTION_OPTIONS={REACTION_OPTIONS}
            />

            <MessageMenu
              message={message}
              mine={mine}
              openMessageMenu={openMessageMenu}
              setOpenMessageMenu={setOpenMessageMenu}
              setOpenReactionPicker={setOpenReactionPicker}
              handleStartReply={handleStartReply}
              handleStartEdit={handleStartEdit}
              handleDeleteMessage={handleDeleteMessage}
              handleReaction={handleReaction}
              REACTION_OPTIONS={REACTION_OPTIONS}
            />
          </div>
        )}

        

        {/* REACTION LIST */}

        <ReactionList
          groupedReactions={
            groupedReactions
          }
          user={user}
          messageId={message.id}
          handleReaction={handleReaction}
        />
      </div>
    </div>
  );
};

export default MessageBubble;