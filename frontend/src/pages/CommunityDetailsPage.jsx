import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMMUNITIES_DATA } from '../utils/constants';
import CommunityHeader from '../components/Community/CommunityHeader';
import CommunityStats from '../components/Community/CommunityStats';
import CommunityBio from '../components/Community/CommunityBio';
import UpcomingEvents from '../components/Community/UpcomingEvents';
import JoinForm from '../components/Community/JoinForm';
import { showPopup } from '../utils/popup';

const CommunityDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const community = COMMUNITIES_DATA[id];
  
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    // Check if current student is already a member of this community
    const checkMembership = () => {
      try {
        const stored = localStorage.getItem('currentStudent');
        if (!stored) return;
        const student = JSON.parse(stored);
        const joined = (student.joinedCommunities || []).some(
          (c) => c.communityId === id
        );
        if (joined) {
          // Already a member — redirect to member page
          navigate(`/communities/${id}/member`, { replace: true });
        }
        setIsMember(joined);
      } catch {
        // ignore parse errors
      }
    };
    checkMembership();

    window.addEventListener('student-profile-updated', checkMembership);
    return () => window.removeEventListener('student-profile-updated', checkMembership);
  }, [id, navigate]);

  const handleJoinClick = () => {
    setShowJoinForm(true);
  };
  const handleFormClose = () => setShowJoinForm(false);

  if (!community) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-600 text-xl">
        Community Not Found
      </div>
    );
  }

  return (
    <div className="bg-slate-100">

      {/* Hero Header */}
      <CommunityHeader
        name={community.name}
        logoUrl={community.logo}
        bgImageUrl={community.bgImage}
        communityId={community.id}
        onJoin={handleJoinClick}
        showJoinButton={!isMember}
      />

      {/* Main Content */}
      <div className="w-full px-8 pt-10 pb-10 space-y-8">

        {/* Quick Stats Bar */}
        <CommunityStats
          communityId={community.id}
          founded={community.founded}
          tagline={community.tagline}
        />

        {/* About */}
        <CommunityBio description={community.description} />

        {/* Upcoming Events */}
        <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)' }}>
          <UpcomingEvents events={community.events} communityId={community.id} />
        </div>

      </div>

      {/* Join Form Modal */}
      {showJoinForm && (
        <JoinForm
          communityId={community.id}
          communityName={community.name}
          onClose={handleFormClose}
        />
      )}

    </div>
  );
};

export default CommunityDetailsPage;
