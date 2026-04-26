import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient';
import { COMMUNITIES_DATA } from '../utils/constants';
import { showPopup, showConfirm } from '../utils/popup';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function AdminChatPage() {
  const { dashboardName, studentId } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [communityId, setCommunityId] = useState('');
  const [thread, setThread] = useState([]);
  const [studentMeta, setStudentMeta] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentAdmin');
    if (!stored) {
      navigate('/login');
      return;
    }
    try {
      const a = JSON.parse(stored);
      if (a.dashboardName !== dashboardName) {
        navigate('/login');
        return;
      }
      setAdmin(a);
    } catch {
      navigate('/login');
    }
  }, [dashboardName, navigate]);

  const loadConversations = useCallback(async () => {
    if (!admin) return;
    try {
      setLoadingList(true);
      const res = await apiFetch('/chat/admin/conversations');
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations(Array.isArray(data.data) ? data.data : []);
        if (data.communityId) setCommunityId(data.communityId);
      }
    } catch {
      showPopup('error', 'Error', 'Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  }, [admin]);

  const loadThread = useCallback(async () => {
    if (!admin || !studentId) return;
    try {
      setLoadingThread(true);
      const res = await apiFetch(`/chat/admin/thread/${studentId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setThread(data.data?.messages || []);
        setStudentMeta(data.data?.student || null);
        if (data.data?.communityId) setCommunityId(data.data.communityId);
        window.dispatchEvent(new Event('admin-chat-updated'));
      } else {
        showPopup('error', 'Error', data.message || 'Failed to load chat');
        navigate(`/admin-dashboard/${dashboardName}/chat`);
      }
    } catch {
      showPopup('error', 'Error', 'Failed to load chat');
      navigate(`/admin-dashboard/${dashboardName}/chat`);
    } finally {
      setLoadingThread(false);
    }
  }, [admin, studentId, dashboardName, navigate]);

  useEffect(() => {
    if (admin && studentId) loadThread();
    else {
      setThread([]);
      setStudentMeta(null);
    }
  }, [admin, studentId, loadThread]);

  useEffect(() => {
    if (admin && !studentId) {
      loadConversations();
    }
  }, [admin, studentId, loadConversations]);

  useEffect(() => {
    if (!admin) return;
    const refresh = async () => {
      await loadConversations();
      if (studentId) {
        await loadThread();
      }
    };

    const intervalId = setInterval(refresh, 6000);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    let bc;
    try {
      bc = new BroadcastChannel('community-hub-chat');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'student-sent') {
          refresh();
        }
      };
    } catch {
      bc = null;
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      bc?.close();
    };
  }, [admin, studentId, loadConversations, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !studentId) return;
    setSending(true);
    try {
      const res = await apiFetch('/chat/admin/send', {
        method: 'POST',
        body: JSON.stringify({ studentId, message: trimmed }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setThread((prev) => [...prev, data.data]);
        setInput('');
        loadConversations();
        window.dispatchEvent(new Event('admin-chat-updated'))
        try {
          const bc = new BroadcastChannel('community-hub-chat')
          bc.postMessage({ type: 'admin-sent', communityId })
          bc.close()
        } catch {
          /* ignore */
        }
      } else if (data.toxic) {
        showPopup('error', 'Message blocked', data.message || 'Content not allowed');
      } else {
        showPopup('error', 'Error', data.message || 'Failed to send');
      }
    } catch {
      showPopup('error', 'Error', 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msg) => {
    const ok = await showConfirm({
      title: 'Delete message?',
      text: 'This will show as deleted for everyone in this chat.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'warning',
    });
    if (!ok) return;
    try {
      const res = await apiFetch(`/chat/admin/message/${msg._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setThread((prev) =>
          prev.map((m) =>
            m._id === msg._id ? { ...m, isDeleted: true, message: '', deletedAt: new Date().toISOString() } : m
          )
        );
        loadConversations();
        window.dispatchEvent(new Event('admin-chat-updated'));
      } else {
        showPopup('error', 'Error', data.message || 'Could not delete');
      }
    } catch {
      showPopup('error', 'Error', 'Could not delete');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openThread = (sid) => {
    navigate(`/admin-dashboard/${dashboardName}/chat/${sid}`);
  };

  const communityName = COMMUNITIES_DATA[communityId]?.name || 'Community';

  const groupedMessages = thread.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80" style={{ background: 'linear-gradient(180deg, #09081d 0%, #121842 45%, #182255 100%)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center px-2 md:px-4"
      style={{ background: 'linear-gradient(180deg, #09081d 0%, #121842 45%, #182255 100%)' }}
    >
      <div
        className="w-full flex flex-col md:flex-row shadow-2xl overflow-hidden mt-2 md:mt-4 rounded-xl border border-white/10"
        style={{ maxWidth: '1100px', height: 'calc(100vh - 88px)' }}
      >
        {/* Conversation list */}
        <aside
          className={`flex flex-col border-b md:border-b-0 md:border-r border-white/10 flex-shrink-0 ${
            studentId ? 'hidden md:flex' : 'flex'
          } md:w-80 w-full`}
          style={{ background: 'linear-gradient(180deg, #111840 0%, #1a225a 100%)' }}
        >
          <div className="px-3 py-3 border-b border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/admin-dashboard/${dashboardName}`)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
              aria-label="Back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-semibold text-sm truncate">{communityName}</h2>
              <p className="text-blue-300/90 text-xs truncate">Member chats</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-blue-400" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-white/50 text-sm px-4 py-6 text-center">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.studentId}
                  type="button"
                  onClick={() => openThread(c.studentId)}
                  className={`w-full text-left px-3 py-3 border-b border-white/5 hover:bg-white/5 transition ${
                    studentId === c.studentId ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">{c.name}</p>
                      <p className="text-white/45 text-xs truncate">{c.itNumber || c.email}</p>
                      <p className="text-white/55 text-xs mt-1 line-clamp-2">{c.lastMessagePreview || '—'}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                  {c.lastMessageAt && (
                    <p className="text-white/35 text-[11px] mt-1">{formatTime(c.lastMessageAt)}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section
          className={`flex-1 flex flex-col min-h-0 ${!studentId ? 'hidden md:flex' : 'flex'}`}
          style={{ minWidth: 0 }}
        >
          {!studentId ? (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center text-white/50 px-6 text-center">
              <p className="text-lg font-medium text-white/70">Select a member</p>
              <p className="text-sm mt-2 max-w-sm">Open a conversation from the list to reply and manage messages.</p>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-2 px-3 py-2.5 text-white flex-shrink-0 border-b border-white/10 md:hidden"
                style={{ background: 'linear-gradient(135deg, #1a225a, #111840)' }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/admin-dashboard/${dashboardName}/chat`)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                  aria-label="Back to list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{studentMeta?.name || 'Member'}</p>
                  <p className="text-blue-300/90 text-xs truncate">{studentMeta?.itNumber || studentMeta?.email || ''}</p>
                </div>
              </div>

              <div
                className="hidden md:flex items-center gap-3 px-4 py-3 text-white flex-shrink-0 border-b border-white/10"
                style={{ background: 'linear-gradient(135deg, #1a225a, #111840)' }}
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[17px] truncate">{studentMeta?.name || 'Member'}</h2>
                  <p className="text-[13px] text-blue-300 leading-tight truncate">
                    {studentMeta?.itNumber || ''} {studentMeta?.email ? `· ${studentMeta.email}` : ''}
                  </p>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-3 py-3 min-h-0"
                style={{
                  background: 'linear-gradient(135deg, #c3dafe 0%, #ddd6fe 50%, #c7d2fe 100%)',
                }}
              >
                {loadingThread ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-300 border-t-[#3b5fdb]" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <p className="font-semibold">No messages yet</p>
                    <p className="text-sm mt-1">Send the first message below.</p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                    <div key={dateKey}>
                      <div className="flex justify-center my-3">
                        <span
                          className="text-[12px] font-medium px-3 py-1 rounded-lg shadow-sm"
                          style={{ background: '#e2e8f0', color: '#475569' }}
                        >
                          {formatDateLabel(msgs[0].createdAt)}
                        </span>
                      </div>
                      {msgs.map((msg) => {
                        const isAdmin = msg.senderRole === 'admin';
                        return (
                          <div key={msg._id} className={`flex mb-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className="relative max-w-[75%] min-w-[100px]"
                              style={{
                                background: msg.isDeleted ? '#f1f5f9' : isAdmin ? '#dbeafe' : '#ffffff',
                                borderRadius: isAdmin ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                padding: '10px 14px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }}
                            >
                              {msg.isDeleted ? (
                                <p className="text-[14px] italic text-gray-500">This message was deleted.</p>
                              ) : (
                                <p className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                              )}
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <p className="text-[11px] text-gray-400">
                                  {formatDateLabel(msg.createdAt)} · {formatTime(msg.createdAt)}
                                </p>
                                {!msg.isDeleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(msg)}
                                    className="text-[11px] text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-end gap-2 px-3 py-2.5 flex-shrink-0 border-t border-white/10" style={{ background: '#e8eaf0' }}>
                <div className="flex-1 flex items-end rounded-3xl px-4 py-2 bg-white border border-[#dfe5e7]">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    rows={1}
                    maxLength={1000}
                    className="flex-1 resize-none text-[15px] text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none leading-snug"
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                    disabled={sending}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                  style={{ background: '#3b5fdb' }}
                  aria-label="Send"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="text-center py-1.5 flex-shrink-0" style={{ background: '#fef3c7' }}>
                <p className="text-[11px] text-amber-800">Messages are screened by AI · 1:1 with this member only</p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminChatPage;
