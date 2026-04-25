import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMMUNITIES_DATA } from '../utils/constants';
import CommunityHeader from '../components/Community/CommunityHeader';
import CommunityStats from '../components/Community/CommunityStats';
import CommunityBio from '../components/Community/CommunityBio';
import UpcomingEvents from '../components/Community/UpcomingEvents';
import JoinForm from '../components/Community/JoinForm';
import { apiFetch } from '../services/apiClient';

const CommunityDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const community = COMMUNITIES_DATA[id];
  
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [requestStatus, setRequestStatus] = useState('none');
  const [approvedReady, setApprovedReady] = useState(false);

  useEffect(() => {
    // Check if current student is already a member of this community
    const checkMembership = async () => {
      try {
        const stored = localStorage.getItem('currentStudent');
        if (!stored) {
          setRequestStatus('none');
          return;
        }
        const student = JSON.parse(stored);
        const studentDocId = student._id || student.id;
        const joined = (student.joinedCommunities || []).some(
          (c) => c.communityId === id
        );
        if (joined) {
          // Already a member — redirect to member page
          navigate(`/communities/${id}/member`, { replace: true });
          return;
        }
        setIsMember(joined);
        setApprovedReady(false);

        if (!joined && studentDocId) {
          const response = await apiFetch(`/communities/${id}/request-status/${studentDocId}`);
          if (response.ok) {
            const result = await response.json();
            const status = result?.data?.status || 'none';
            setRequestStatus(status);

            if (status === 'approved') {
              setApprovedReady(true);
              // Refresh student profile to persist new membership in local state.
              const profileRes = await apiFetch(`/students/${studentDocId}`);
              if (profileRes.ok) {
                const profileResult = await profileRes.json();
                const latestStudent = profileResult?.data;
                if (latestStudent) {
                  localStorage.setItem('currentStudent', JSON.stringify(latestStudent));
                  window.dispatchEvent(new Event('student-profile-updated'));
                }
              }
            }
          } else {
            setRequestStatus('none');
          }
        } else if (!joined) {
          setRequestStatus('none');
        }
      } catch {
        // ignore parse errors
        setRequestStatus('none');
      }
    };
    checkMembership();

    window.addEventListener('student-profile-updated', checkMembership);
    return () => window.removeEventListener('student-profile-updated', checkMembership);
  }, [id, navigate]);

  const handleJoinClick = () => {
    if (requestStatus === 'pending') {
      return;
    }
    if (requestStatus === 'approved') {
      navigate(`/communities/${id}/member`);
      return;
    }
    setShowJoinForm(true);
  };
  const handleFormClose = () => setShowJoinForm(false);
  const handleJoinSubmitted = (status) => {
    if (status) {
      setRequestStatus(status);
    }
  };
  const goToMemberPage = () => navigate(`/communities/${id}/member`);

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
        joinButtonText={
          requestStatus === 'approved'
            ? 'Go to Member Area'
            : requestStatus === 'pending'
              ? 'Pending Approval'
              : requestStatus === 'rejected'
                ? 'Re-Request to Join'
                : 'Join Community'
        }
        joinButtonDisabled={requestStatus === 'pending'}
      />

      {(requestStatus === 'approved' || approvedReady) && (
        <div className="px-8 pt-6">
          <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-emerald-900 md:text-emerald-100 font-medium">
              Your join request was approved. Open your member page to access chat and community actions.
            </p>
            <button
              type="button"
              onClick={goToMemberPage}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Go to Member Area
            </button>
          </div>
        </div>
      )}

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
          onSubmitted={handleJoinSubmitted}
        />
      )}

    </div>
  );
};

export default CommunityDetailsPage;
