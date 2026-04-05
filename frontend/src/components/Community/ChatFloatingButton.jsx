import { useNavigate } from 'react-router-dom';

const ChatFloatingButton = ({ communityId }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/chat/${communityId}`)}
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center animate-pulse transition-all"
      aria-label="Chat With Admin"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.39-1.03L3 21l1.1-4.5A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
};

export default ChatFloatingButton;
