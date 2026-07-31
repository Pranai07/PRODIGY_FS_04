import { LogOut, Palette } from "lucide-react";

const CurrentUser = ({
  user,
  onLogout,
  onOpenProfile,
  onOpenAppearance,
  getInitial,
}) => {
  return (
    <div
      className="current-user"
      onClick={onOpenProfile}
      role="button"
      tabIndex={0}
      title="Open profile"
      onKeyDown={(e) => {
        if (
          e.key === "Enter" ||
          e.key === " "
        ) {
          e.preventDefault();
          onOpenProfile();
        }
      }}
    >
      <div className="avatar">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="avatar-image"
          />
        ) : (
          getInitial(user?.name)
        )}
      </div>

      <div className="current-user-info">
        <strong>{user?.name}</strong>

        <span>{user?.email}</span>
      </div>
      <div className="current-user-actions">
        <button
          type="button"
          className="logout-button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAppearance();
          }}
          title="Appearance"
          aria-label="Appearance"
        >
          <Palette size={19} />
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
          }}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={19} />
        </button>
      </div>
    </div>
  );
};

export default CurrentUser;