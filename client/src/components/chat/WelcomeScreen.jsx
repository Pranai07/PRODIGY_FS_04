import { MessageCircle } from "lucide-react";

const WelcomeScreen = () => {
  return (
    <div className="welcome-chat">
      <div className="welcome-icon">
        <MessageCircle size={46} />
      </div>

      <h2>Welcome to Chatz</h2>

      <p>
        Select a person or room to start chatting.
      </p>
    </div>
  );
};

export default WelcomeScreen;