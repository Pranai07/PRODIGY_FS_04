const MessageEditor = ({
  editingContent,
  setEditingContent,
  handleSaveEdit,
  handleCancelEdit,
  messageId,
}) => {
  return (
    <div className="message-edit-container">
      <textarea
        className="message-edit-input"
        value={editingContent}
        onChange={(e) =>
          setEditingContent(e.target.value)
        }
        autoFocus
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit(messageId);
          }

          if (e.key === "Escape") {
            handleCancelEdit();
          }
        }}
      />

      <div className="message-edit-actions">
        <button
          type="button"
          className="message-edit-cancel"
          onClick={handleCancelEdit}
        >
          Cancel
        </button>

        <button
          type="button"
          className="message-edit-save"
          onClick={() =>
            handleSaveEdit(messageId)
          }
          disabled={!editingContent.trim()}
        >
          Save
        </button>
      </div>

      <span className="message-edit-hint">
        Enter to save • Esc to cancel
      </span>
    </div>
  );
};

export default MessageEditor;