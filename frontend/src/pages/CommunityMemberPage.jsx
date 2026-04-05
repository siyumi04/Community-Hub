import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMMUNITIES_DATA } from '../utils/constants';
import CommunityHeader from '../components/Community/CommunityHeader';
import CommunityStats from '../components/Community/CommunityStats';
import CommunityBio from '../components/Community/CommunityBio';
import UpcomingEvents from '../components/Community/UpcomingEvents';
import NoticeBoard from '../components/Notices/NoticeBoard';
import ChatFloatingButton from '../components/Community/ChatFloatingButton';
import { apiFetch } from '../services/apiClient';
import { showPopup, showConfirm } from '../utils/popup';

const CommunityMemberPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const community = COMMUNITIES_DATA[id];
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    const storedStudent = localStorage.getItem('currentStudent');
    if (!storedStudent) {
      showPopup('Please log in first', 'error');
      navigate('/login');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Leave Community?',
      text: `Are you sure you want to leave ${community?.name}? Your member ID will be permanently removed.`,
      confirmText: 'Yes, Leave',
      cancelText: 'Cancel',
      icon: 'warning',
    });

    if (!confirmed) return;

    const currentStudent = JSON.parse(storedStudent);
    const studentId = currentStudent._id || currentStudent.id;

    setLeaving(true);
    try {
      const response = await apiFetch(`/communities/${id}/${studentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        showPopup(result.message || 'Failed to leave community', 'error');
        return;
      }

      // Update localStorage — remove this community from joinedCommunities
      const updated = {
        ...currentStudent,
        joinedCommunities: (currentStudent.joinedCommunities || []).filter(
          (c) => c.communityId !== id
        ),
      };
      localStorage.setItem('currentStudent', JSON.stringify(updated));
      window.dispatchEvent(new Event('student-profile-updated'));

      showPopup(`You have left ${community?.name}.`, 'success');
      navigate(`/communities/${id}`);
    } catch (error) {
      showPopup(error.message || 'An error occurred while leaving the community', 'error');
    } finally {
      setLeaving(false);
    }
  };

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
        showJoinButton={false}
        showLeaveButton={true}
        onLeave={handleLeave}
        leaving={leaving}
      />

      {/* Main Content — vertical stack, full width */}
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

        {/* Admin Notices */}
        <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)' }}>
          <NoticeBoard />
        </div>

      </div>

      {/* Floating Chat Button */}
      <ChatFloatingButton communityId={community.id} />

    </div>
  );
};

export default CommunityMemberPage;
