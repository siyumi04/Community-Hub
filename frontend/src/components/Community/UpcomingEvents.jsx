const CARD_BG = {
  cricket:       'linear-gradient(160deg, #451a03 0%, #b45309 100%)',
  hockey:        'linear-gradient(160deg, #1a1a3e 0%, #2d2d7a 100%)',
  environmental: 'linear-gradient(160deg, #0a3d3d 0%, #0d9488 100%)',
  foc:           'linear-gradient(160deg, #3d0066 0%, #7b2ff7 100%)',
  food:          'linear-gradient(160deg, #7c2d12 0%, #c2410c 100%)',
};

const ACCENT_STRIP = {
  cricket:       'linear-gradient(90deg, #b45309, #f59e0b)',
  hockey:        'linear-gradient(90deg, #2d2d7a, #6366f1)',
  environmental: 'linear-gradient(90deg, #0d9488, #2dd4bf)',
  foc:           'linear-gradient(90deg, #7b2ff7, #a855f7)',
  food:          'linear-gradient(90deg, #c2410c, #fb923c)',
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const UpcomingEvents = ({ events = [], communityId }) => {
  const cardBg = CARD_BG[communityId] || 'linear-gradient(160deg, #1e293b 0%, #334155 100%)';
  const strip = ACCENT_STRIP[communityId] || 'linear-gradient(90deg, #6366f1, #a855f7)';

  return (
    <div>
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 rounded-full" style={{ background: strip }} />
        <h2 className="text-2xl font-bold text-white tracking-tight">Upcomming Opportunities</h2>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {events.slice(0, 4).map((event, index) => (
          <div
            key={index}
            className="rounded-xl overflow-hidden shadow-lg border border-white/10 flex flex-col"
            style={{ background: cardBg }}
          >
            {/* Event Image / Placeholder */}
            <div className="relative w-full h-40 bg-white/5 overflow-hidden">
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              {/* Fallback placeholder — always rendered, hidden when image loads */}
              <div
                className="absolute inset-0 items-center justify-center text-white/20 text-5xl"
                style={{ display: event.image ? 'none' : 'flex' }}
              >
                📸
              </div>

              {/* Date badge */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
                <span className="text-white text-xs font-bold block">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-white text-lg font-black leading-none">
                  {new Date(event.date).getDate()}
                </span>
              </div>
            </div>

            {/* Accent strip */}
            <div className="h-1 w-full" style={{ background: strip }} />

            {/* Event details */}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-sm text-white mb-2 line-clamp-2 leading-snug">
                {event.title}
              </h3>
              <div className="mt-auto flex items-center gap-1.5 text-white/50 text-xs">
                <span>📍</span>
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
                <span>🗓️</span>
                <span>{formatDate(event.date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
