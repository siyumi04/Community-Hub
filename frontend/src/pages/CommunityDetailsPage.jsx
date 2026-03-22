import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { COMMUNITIES_DATA } from '../utils/constants';
import CommunityHeader from '../components/CommunityHeader';
import CommunityBio from '../components/CommunityBio';
import JoinForm from '../components/JoinForm';

const CommunityDetailsPage = () => {
  const { id } = useParams();
  const community = COMMUNITIES_DATA[id];
  
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleJoinClick = () => setShowJoinForm(true);
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
      />

      {/* Main Content — Bio only for non-members */}
      <div className="w-full px-8 pt-10 pb-10">
        <CommunityBio description={community.description} />
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
