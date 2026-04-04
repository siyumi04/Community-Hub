import { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

const ACCENT_COLORS = {
  cricket:       { from: '#b45309', to: '#451a03' },
  hockey:        { from: '#2d2d7a', to: '#1a1a3e' },
  environmental: { from: '#0d9488', to: '#0a3d3d' },
  foc:           { from: '#7b2ff7', to: '#3d0066' },
  food:          { from: '#c2410c', to: '#7c2d12' },
};

const CommunityStats = ({ communityId, founded, tagline }) => {
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await apiFetch(`/communities/${communityId}`);
        if (res.ok) {
          const result = await res.json();
          setMemberCount(result.data?.memberCount ?? result.data?.members?.length ?? 0);
        }
      } catch {
        // Fallback — keep 0
      }
    };
    fetchCount();

    // Re-fetch when student joins or leaves
    const handleUpdate = () => fetchCount();
    window.addEventListener('student-profile-updated', handleUpdate);
    return () => window.removeEventListener('student-profile-updated', handleUpdate);
  }, [communityId]);

  const colors = ACCENT_COLORS[communityId] || { from: '#334155', to: '#1e293b' };

  const stats = [
    { label: 'Members', value: memberCount, icon: '👥' },
    { label: 'Motto', value: tagline || '—', icon: '🎯' },
    { label: 'Founded', value: founded || '—', icon: '📅' },
  ];

  return (
    <div
      className="rounded-2xl shadow-xl overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)` }}
    >
      <div className="grid grid-cols-3 divide-x divide-white/10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center justify-center py-6 px-4">
            <span className="text-2xl mb-1">{stat.icon}</span>
            <span className="text-white text-2xl font-bold tracking-tight">
              {stat.value}
            </span>
            <span className="text-white/60 text-xs font-semibold uppercase tracking-widest mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityStats;
