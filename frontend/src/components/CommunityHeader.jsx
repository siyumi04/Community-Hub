const FALLBACK_GRADIENTS = {
  cricket:       'linear-gradient(135deg, #1a3c2e 0%, #2d6a4f 100%)',
  hockey:        'linear-gradient(135deg, #1a1a3e 0%, #2d2d7a 100%)',
  environmental: 'linear-gradient(135deg, #1b4332 0%, #40916c 100%)',
  foc:           'linear-gradient(135deg, #3d0066 0%, #7b2ff7 100%)',
  food:          'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
};

const CommunityHeader = ({ name, logoUrl, bgImageUrl, onJoin, communityId, showJoinButton = true }) => {
  const fallback = FALLBACK_GRADIENTS[communityId] || 'linear-gradient(135deg, #1e293b, #334155)';

  return (
    <div
      className="relative w-full h-[560px] bg-cover bg-center"
      style={{
        backgroundImage: bgImageUrl ? `url(${bgImageUrl}), ${fallback}` : fallback,
      }}
    >
      {/* Dark glass overlay — brightness reduction only, no blur */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.52)' }}
      />

      {/* Content */}
      <div className="relative w-full px-12 h-full flex items-center gap-10">

        {/* Left: Logo + Join Button stacked */}
        <div className="flex flex-col items-center gap-5 flex-shrink-0">
          <img
            src={logoUrl}
            alt={`${name} logo`}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            className="w-56 h-56 rounded-full shadow-2xl object-cover"
          />
          <div
            style={{ display: 'none' }}
            className="w-56 h-56 rounded-full shadow-2xl bg-white/20 items-center justify-center text-white text-6xl font-bold"
          >
            {name?.charAt(0)}
          </div>

          {showJoinButton && (
            <button
              onClick={onJoin}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-full font-semibold shadow-lg transition-all text-sm tracking-wide"
            >
              Join Community
            </button>
          )}
        </div>

        {/* Community Name */}
        <h1 className="text-white text-5xl font-bold tracking-tight drop-shadow-lg leading-snug">
          {name}
        </h1>

      </div>
    </div>
  );
};

export default CommunityHeader;
