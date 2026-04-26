import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient';
import { COMMUNITIES_DATA } from '../utils/constants';
import { showPopup, showConfirm } from '../utils/popup';

const ChatPage = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const community = COMMUNITIES_DATA[communityId];
  const communityName = community?.name || 'Community';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await apiFetch(`/chat/${communityId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
          window.dispatchEvent(new Event('student-chat-updated'));
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [communityId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await apiFetch('/chat/send', {
        method: 'POST',
        body: JSON.stringify({ communityId, message: trimmed }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setInput('');
        window.dispatchEvent(new Event('student-chat-updated'))
        try {
          const bc = new BroadcastChannel('community-hub-chat')
          bc.postMessage({ type: 'student-sent', communityId })
          bc.close()
        } catch {
          /* ignore */
        }
      } else if (data.toxic) {
        showPopup('error', 'Message blocked', data.message);
      } else {
        showPopup('error', 'Error', data.message || 'Failed to send message');
      }
    } catch {
      showPopup('error', 'Error', 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msg) => {
    if (msg.isDeleted || msg.senderRole === 'admin') return;
    const ok = await showConfirm({
      title: 'Delete this message?',
      text: 'Others will see that the message was deleted.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'warning',
    });
    if (!ok) return;
    try {
      const res = await apiFetch(`/chat/message/${msg._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msg._id ? { ...m, isDeleted: true, message: '', deletedAt: new Date().toISOString() } : m
          )
        );
        window.dispatchEvent(new Event('student-chat-updated'));
      } else {
        showPopup('error', 'Error', data.message || 'Could not delete message');
      }
    } catch {
      showPopup('error', 'Error', 'Could not delete message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <div className="min-h-screen flex items-start justify-center" style={{ background: 'linear-gradient(180deg, #09081d 0%, #121842 45%, #182255 100%)' }}>
      {/* Chat Box Container */}
      <div
        className="w-full flex flex-col shadow-2xl overflow-hidden"
        style={{ maxWidth: '850px', height: 'calc(100vh - 80px)', marginTop: '10px', borderRadius: '12px' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 text-white select-none flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1a225a, #111840)' }}
        >
          <button
            onClick={() => navigate(`/communities/${communityId}/member`)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[17px] leading-tight truncate">{communityName}</h2>
            <p className="text-[13px] text-blue-300 leading-tight">Chat with Admin</p>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, #c3dafe 0%, #ddd6fe 50%, #c7d2fe 100%)',
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-300 border-t-[#3b5fdb]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.39-1.03L3 21l1.1-4.5A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-[16px] font-semibold text-gray-600">No messages yet</p>
              <p className="text-[14px] mt-1 text-gray-400">Send a message to start the conversation</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([dateKey, msgs]) => (
              <div key={dateKey}>
                {/* Date label pill */}
                <div className="flex justify-center my-3">
                  <span
                    className="text-[12px] font-medium px-3 py-1 rounded-lg shadow-sm"
                    style={{ background: '#e2e8f0', color: '#475569' }}
                  >
                    {formatDateLabel(msgs[0].createdAt)}
                  </span>
                </div>

                {msgs.map((msg) => {
                  const isStudent = msg.senderRole === 'student';
                  return (
                    <div
                      key={msg._id}
                      className={`flex mb-1.5 ${isStudent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="relative px-3.5 py-2.5 shadow-sm"
                        style={{
                          background: msg.isDeleted ? '#f1f5f9' : isStudent ? '#dbeafe' : '#ffffff',
                          borderRadius: isStudent
                            ? '12px 12px 4px 12px'
                            : '12px 12px 12px 4px',
                          maxWidth: '65%',
                          minWidth: '80px',
                        }}
                      >
                        {msg.isDeleted ? (
                          <p className="text-[14px] italic text-gray-500">This message was deleted.</p>
                        ) : (
                          <p className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <p className="text-[11px] text-gray-400">
                            {formatDateLabel(msg.createdAt)} · {formatTime(msg.createdAt)}
                          </p>
                          {isStudent && !msg.isDeleted && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg)}
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

        {/* Input Bar */}
        <div className="flex items-end gap-2 px-3 py-2.5 flex-shrink-0" style={{ background: '#e8eaf0' }}>
          <div
            className="flex-1 flex items-end rounded-3xl px-4 py-2 bg-white"
            style={{ border: '1px solid #dfe5e7' }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              rows={1}
              maxLength={1000}
              className="flex-1 resize-none text-[15px] text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none leading-snug"
              style={{ minHeight: '24px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              disabled={sending}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#3b5fdb' }}
            aria-label="Send message"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* AI notice strip */}
        <div className="text-center py-1.5 flex-shrink-0" style={{ background: '#fef3c7' }}>
          <p className="text-[12px] text-amber-700 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            Messages are screened by AI for inappropriate content
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
