import themes from "../../constants/themes";
import "./AppearanceModal.css";

const AppearanceModal = ({
  isOpen,
  onClose,
  selectedTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const icons = {
    light: "☀️",
    dark: "🌙",
    system: "💻",
  };

  return (
    <div
      className="appearance-overlay"
      onClick={onClose}
    >
      <div
        className="appearance-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="appearance-header">
          <div>
            <h2>Appearance</h2>
            <p>Choose how Chatz looks on your device</p>
          </div>

          <button
            type="button"
            className="appearance-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="appearance-options">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`appearance-option ${
                selectedTheme === theme.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelectTheme(theme.id)
              }
            >
              <span className="appearance-icon">
                {icons[theme.id]}
              </span>

              <span className="appearance-info">
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </span>

              <span
                className={`appearance-radio ${
                  selectedTheme === theme.id
                    ? "selected"
                    : ""
                }`}
              >
                {selectedTheme === theme.id && "✓"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceModal;