const CommunityBio = ({ description }) => {
  return (
    <div className="bg-slate-50 rounded-2xl shadow-xl p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">
        About Our Community
      </p>
      <p className="text-slate-700 text-lg italic font-serif leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default CommunityBio;
