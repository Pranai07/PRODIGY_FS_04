const ReactionList = ({
  groupedReactions,
  user,
  messageId,
  handleReaction,
}) => {
  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }

  return (
    <div className="message-reactions">
      {Object.entries(groupedReactions).map(
        ([emoji, reactions]) => {
          const reactedByMe = reactions.some(
            (reaction) =>
              reaction.userId === user.id
          );

          return (
            <button
              key={emoji}
              type="button"
              className={`reaction-chip ${
                reactedByMe
                  ? "reacted-by-me"
                  : ""
              }`}
              onClick={() =>
                handleReaction(messageId, emoji)
              }
              title={reactions
                .map(
                  (reaction) =>
                    reaction.user?.name ||
                    "User"
                )
                .join(", ")}
            >
              <span>{emoji}</span>

              <span>{reactions.length}</span>
            </button>
          );
        }
      )}
    </div>
  );
};

export default ReactionList;