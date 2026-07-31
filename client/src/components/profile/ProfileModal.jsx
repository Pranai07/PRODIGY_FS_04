const ProfileModal = ({
  showProfileModal,
  setShowProfileModal,
  profile,
  profileName,
  setProfileName,
  savingProfile,
  handleSaveProfile,
  getInitial,
  profileAvatarPreview,
  profileAvatarFile,
  profileAvatarInputRef,
  handleProfileAvatarSelect,
  handleUploadProfileAvatar,
  uploadingAvatar,
}) => {
  if (!showProfileModal) {
    return null;
  }

  return (
    <div
      className="profile-modal-overlay"
      onClick={() => setShowProfileModal(false)}
    >
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}

        <button
          type="button"
          className="profile-modal-close"
          onClick={() => setShowProfileModal(false)}
          aria-label="Close profile"
        >
          ×
        </button>

        {/* PROFILE HEADER */}

        <div className="profile-modal-header">
          <div
            className="profile-avatar-large profile-avatar-editable"
            onClick={() =>
              profileAvatarInputRef.current?.click()
            }
            role="button"
            tabIndex={0}
            title="Change profile picture"
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                e.preventDefault();
                profileAvatarInputRef.current?.click();
              }
            }}
          >
            {profileAvatarPreview ||
            profile?.avatar ? (
              <img
                src={
                  profileAvatarPreview ||
                  profile.avatar
                }
                alt={
                  profile?.name ||
                  "Profile"
                }
              />
            ) : (
              <span>
                {getInitial(profile?.name)}
              </span>
            )}

            <div className="profile-avatar-overlay">
              <span>📷</span>
              <small>Change</small>
            </div>
          </div>

          <input
            ref={profileAvatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleProfileAvatarSelect}
            className="profile-avatar-input"
          />

          {profileAvatarFile && (
            <button
              type="button"
              className="profile-avatar-save-button"
              onClick={handleUploadProfileAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar
                ? "Uploading..."
                : "Save Profile Picture"}
            </button>
          )}

          <h2>
            {profile?.name || "My Profile"}
          </h2>

          <p>{profile?.email}</p>
        </div>

        {/* PROFILE DETAILS */}

        <div className="profile-modal-body">
          <div className="profile-field">
            <label htmlFor="profile-name">
              Name
            </label>

            <input
              id="profile-name"
              type="text"
              value={profileName}
              onChange={(e) =>
                setProfileName(e.target.value)
              }
              maxLength={50}
              placeholder="Your name"
            />
          </div>

          <div className="profile-field">
            <label>Email</label>

            <input
              type="email"
              value={profile?.email || ""}
              disabled
            />

            <span className="profile-field-hint">
              Email cannot be changed here.
            </span>

            <div className="profile-modal-actions">
              <button
                type="button"
                className="profile-save-button"
                onClick={handleSaveProfile}
                disabled={
                  savingProfile ||
                  !profileName.trim() ||
                  profileName.trim() ===
                    profile?.name
                }
              >
                {savingProfile
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;