import { useParams } from 'react-router-dom';
import { COMMUNITIES_DATA } from '../utils/constants';
import CommunityHeader from '../components/CommunityHeader';
import CommunityBio from '../components/CommunityBio';
import NoticeBoard from '../components/NoticeBoard';
import ChatFloatingButton from '../components/ChatFloatingButton';

const CommunityMemberPage = () => {
  const { id } = useParams();
  const community = COMMUNITIES_DATA[id];

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
      />

      {/* Main Content — vertical stack, full width */}
      <div className="w-full px-8 pt-10 pb-10">
        <div className="mb-8">
          <CommunityBio description={community.description} />
        </div>
        {/* Dark section for notices so white heading & cards are visible */}
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
