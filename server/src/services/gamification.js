const User = require('../models/User');

// XP needed to reach level N grows quadratically: level = floor(sqrt(xp/100)) + 1
function levelForXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

const BADGES = [
  { id: 'first-action', label: 'First Steps', test: (u) => u.lifetimeCredits > 0 },
  { id: 'tree-hugger', label: 'Tree Hugger', test: (u) => u.lifetimeCO2 >= 1 },
  { id: 'carbon-crusher', label: 'Carbon Crusher', test: (u) => u.lifetimeCO2 >= 10 },
  { id: 'planet-guardian', label: 'Planet Guardian', test: (u) => u.lifetimeCO2 >= 100 },
  { id: 'streak-7', label: 'Week Warrior', test: (u) => u.streak?.longest >= 7 },
  { id: 'streak-30', label: 'Monthly Master', test: (u) => u.streak?.longest >= 30 },
  { id: 'merchant', label: 'Merchant', test: (u) => u.lifetimeRevenue >= 100 },
  { id: 'connector', label: 'Connector', test: (u) => u.referralCount >= 3 },
];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isYesterday(prev, now) {
  const y = new Date(now); y.setDate(y.getDate() - 1);
  return isSameDay(prev, y);
}

// Recomputes streak from the last action date relative to now.
function nextStreak(streak = {}, now = new Date()) {
  const last = streak.lastActionDate ? new Date(streak.lastActionDate) : null;
  let current = streak.current || 0;
  if (!last) current = 1;
  else if (isSameDay(last, now)) current = current || 1; // already counted today
  else if (isYesterday(last, now)) current += 1;
  else current = 1; // streak broken
  const longest = Math.max(streak.longest || 0, current);
  return { current, longest, lastActionDate: now };
}

// Award XP + recompute level/streak/badges after a credit-earning action.
// Returns the list of newly unlocked badge labels (for notifications).
async function awardForAction(userId, { xp = 0, bumpStreak = true } = {}) {
  const user = await User.findById(userId).select(
    'xp level badges streak lifetimeCredits lifetimeCO2 lifetimeRevenue referralCount'
  );
  if (!user) return [];

  user.xp += xp;
  user.level = levelForXp(user.xp);
  if (bumpStreak) user.streak = nextStreak(user.streak);

  const newly = [];
  for (const b of BADGES) {
    if (!user.badges.includes(b.id) && b.test(user)) {
      user.badges.push(b.id);
      newly.push(b.label);
    }
  }
  await user.save();
  return newly;
}

module.exports = { levelForXp, nextStreak, awardForAction, BADGES };
