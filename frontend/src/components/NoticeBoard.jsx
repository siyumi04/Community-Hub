const NoticeBoard = ({ notices = [] }) => {
  return (
    <div>

      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
        <h2 className="text-2xl font-bold text-white tracking-tight">Admin Notices</h2>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {notices.slice(0, 6).map((notice, index) => (
          <div
            key={index}
            className="rounded-xl overflow-hidden border border-indigo-700/40 shadow-lg"
            style={{ background: 'linear-gradient(160deg, #1e2660 0%, #2A265A 80%, #1a1a4a 100%)' }}
          >
            {/* Top accent stripe */}
            <div
              className="h-1 w-full"
              style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
            />
            <div className="p-5">
              <h3 className="font-bold text-sm text-indigo-200 uppercase tracking-wider mb-2">
                {notice.title}
              </h3>
              {/* Divider */}
              <div className="w-10 h-px bg-indigo-400/40 mb-3" />
              <p className="text-slate-300 text-xs leading-relaxed">
                {notice.body}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default NoticeBoard;
