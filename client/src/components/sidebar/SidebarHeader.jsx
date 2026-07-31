import { MessageCircle } from "lucide-react";

const SidebarHeader = () => {
  return (
    <div className="sidebar-header">
      <div className="chat-logo">
        <MessageCircle size={25} />

        <div>
          <h1>Chatz</h1>
          <span>Real-time messaging</span>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;