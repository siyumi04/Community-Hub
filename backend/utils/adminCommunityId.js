/**
 * Resolves canonical community id (cricket | hockey | …) from an Admin document.
 * Kept in sync with communityController membership / analytics mapping.
 */
const COMMUNITY_ID_BY_DASHBOARD = {
  'Cricket Club': 'cricket',
  'Hockey Club': 'hockey',
  'Environmental Community': 'environmental',
  'FOC Event Club': 'foc',
  'Food & Beverages Community': 'food',
};

const normalizeValue = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const DASHBOARD_ALIAS_TO_COMMUNITY_ID = {
  cricket: 'cricket',
  'cricket club': 'cricket',
  'cricket dashboard': 'cricket',
  'cricket admin dashboard': 'cricket',
  'cricket club dashboard': 'cricket',
  'cricket community': 'cricket',
  hockey: 'hockey',
  hokey: 'hockey',
  'hockey club': 'hockey',
  'hokey club': 'hockey',
  'hockey dashboard': 'hockey',
  'hokey dashboard': 'hockey',
  'hockey admin dashboard': 'hockey',
  'hokey admin dashboard': 'hockey',
  'hockey club dashboard': 'hockey',
  'hokey club dashboard': 'hockey',
  'hockey community': 'hockey',
  'hokey community': 'hockey',
  environmental: 'environmental',
  'environmental community': 'environmental',
  'enviromental community': 'environmental',
  'environmental club': 'environmental',
  'enviromental club': 'environmental',
  'environmental dashboard': 'environmental',
  'enviromental dashboard': 'environmental',
  'environmental admin dashboard': 'environmental',
  'environmental club dashboard': 'environmental',
  'enviromental club dashboard': 'environmental',
  foc: 'foc',
  'foc event club': 'foc',
  'foc club': 'foc',
  'foc dashboard': 'foc',
  'foc admin dashboard': 'foc',
  'foc club dashboard': 'foc',
  'foc community': 'foc',
  food: 'food',
  'food community': 'food',
  'food and beverages community': 'food',
  'food beverages community': 'food',
  'food and beverage community': 'food',
  'food dashboard': 'food',
  'food admin dashboard': 'food',
  'food community dashboard': 'food',
  'food and beverages dashboard': 'food',
};

export function resolveCommunityIdFromAdmin(admin = {}, dashboardNameHint = '') {
  if (!admin && !dashboardNameHint) return '';

  if (admin?.dashboardName && COMMUNITY_ID_BY_DASHBOARD[admin.dashboardName]) {
    return COMMUNITY_ID_BY_DASHBOARD[admin.dashboardName];
  }
  if (dashboardNameHint && COMMUNITY_ID_BY_DASHBOARD[dashboardNameHint]) {
    return COMMUNITY_ID_BY_DASHBOARD[dashboardNameHint];
  }

  const candidates = [admin?.dashboardName, admin?.username, admin?.email, dashboardNameHint].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeValue(candidate);
    if (!normalized) continue;

    if (DASHBOARD_ALIAS_TO_COMMUNITY_ID[normalized]) {
      return DASHBOARD_ALIAS_TO_COMMUNITY_ID[normalized];
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.includes('cricket')) return 'cricket';
    if (tokens.includes('hockey') || tokens.includes('hokey')) return 'hockey';
    if (tokens.includes('environmental')) return 'environmental';
    if (tokens.includes('foc')) return 'foc';
    if (tokens.includes('food')) return 'food';
  }

  return '';
}

/** Messages that count as “from member” for admin unread (student + legacy docs without senderRole). */
export const fromMemberSenderFilter = () => ({
  senderRole: { $nin: ['admin'] },
});
