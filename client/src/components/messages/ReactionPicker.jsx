const ReactionPicker = ({
  messageId,
  openReactionPicker,
  setOpenReactionPicker,
  setOpenMessageMenu,
  handleReaction,
  REACTION_OPTIONS,
}) => {
  return (
    <div className="reaction-actions">
      {openReactionPicker === messageId && (
        <div className="reaction-picker">
          {REACTION_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                handleReaction(messageId, emoji)
              }
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;