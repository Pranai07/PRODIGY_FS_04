import { Paperclip, Send } from "lucide-react";

const MessageInput = ({
  fileInputRef,
  handleFileSelect,
  handleSend,
  messageText,
  handleMessageChange,
  inputPlaceholder,
  selectedFile,
  uploadingFile,
  sending,
}) => {
  return (
    <form
      className="message-form"
      onSubmit={handleSend}
    >
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx"
        onChange={handleFileSelect}
      />

      <button
        type="button"
        className="attachment-button"
        onClick={() =>
          fileInputRef.current?.click()
        }
        disabled={
          uploadingFile ||
          sending
        }
        title="Attach a file"
      >
        <Paperclip size={19} />
      </button>

      <input
        type="text"
        placeholder={
          uploadingFile
            ? "Uploading attachment..."
            : selectedFile
            ? "Add a caption..."
            : inputPlaceholder
        }
        value={messageText}
        onChange={handleMessageChange}
        autoComplete="off"
        disabled={uploadingFile}
      />

      <button
        type="submit"
        disabled={
          (!messageText.trim() &&
            !selectedFile) ||
          sending ||
          uploadingFile
        }
        title={`Send to ${inputPlaceholder}`}
      >
        <Send size={19} />
      </button>
    </form>
  );
};

export default MessageInput;