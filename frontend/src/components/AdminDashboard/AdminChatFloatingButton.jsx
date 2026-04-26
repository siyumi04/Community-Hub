import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../services/apiClient';

function AdminChatFloatingButton() {
  const { dashboardName } = useParams();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await apiFetch('/chat/admin/unread-total');
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
    fetchUnread();
    const t = setInterval(fetchUnread, 6000);
    const onEvt = () => fetchUnread();
    window.addEventListener('admin-chat-updated', onEvt);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    window.addEventListener('focus', onEvt);
    document.addEventListener('visibilitychange', onVis);

    let bc;
    try {
      bc = new BroadcastChannel('community-hub-chat');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'student-sent') fetchUnread();
      };
    } catch {
      bc = null;
    }

    return () => {
      clearInterval(t);
      window.removeEventListener('admin-chat-updated', onEvt);
      window.removeEventListener('focus', onEvt);
      document.removeEventListener('visibilitychange', onVis);
      bc?.close();
    };
  }, [dashboardName]);

  return (
    <button
      type="button"
      onClick={() => navigate(`/admin-dashboard/${dashboardName}/chat`)}
      className="admin-chat-fab"
      aria-label="Member chats"
      title="Member chats"
    >
      {unread > 0 && <span className="admin-chat-fab-dot" aria-hidden />}
      <svg xmlns="http://www.w3.org/2000/svg" className="admin-chat-fab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.39-1.03L3 21l1.1-4.5A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {unread > 0 && (
        <span className="admin-chat-fab-badge">{unread > 99 ? '99+' : unread}</span>
      )}
    </button>
  );
}

export default AdminChatFloatingButton;
