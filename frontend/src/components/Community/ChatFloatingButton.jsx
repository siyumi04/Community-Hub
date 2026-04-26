import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/apiClient';

const ChatFloatingButton = ({ communityId }) => {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await apiFetch(`/chat/unread/${communityId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setUnread(Number(data.data.count) || 0);
      } else {
        setUnread(0);
      }
    } catch {
      setUnread(0);
    }
  };

  useEffect(() => {
    if (!communityId) return;
    fetchUnread();
    const t = setInterval(fetchUnread, 6000);
    const onEvt = () => fetchUnread();
    window.addEventListener('student-chat-updated', onEvt);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    window.addEventListener('focus', onEvt);
    document.addEventListener('visibilitychange', onVis);

    let bc;
    try {
      bc = new BroadcastChannel('community-hub-chat');
      bc.onmessage = (ev) => {
        const { type, communityId: cid } = ev?.data || {};
        if (type === 'admin-sent' && cid && cid === communityId) fetchUnread();
      };
    } catch {
      bc = null;
    }

    return () => {
      clearInterval(t);
      window.removeEventListener('student-chat-updated', onEvt);
      window.removeEventListener('focus', onEvt);
      document.removeEventListener('visibilitychange', onVis);
      bc?.close();
    };
  }, [communityId]);

  return (
    <button
      type="button"
      onClick={() => navigate(`/chat/${communityId}`)}
      className="student-chat-fab"
      aria-label="Chat with admin"
    >
      {unread > 0 && <span className="student-chat-fab-dot" aria-hidden />}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="student-chat-fab-icon"
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
      {unread > 0 && (
        <span className="student-chat-fab-badge">{unread > 99 ? '99+' : unread}</span>
      )}
    </button>
  );
};

export default ChatFloatingButton;
