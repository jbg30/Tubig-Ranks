export const RANKS = [
  { name: 'Unranked', min: -Infinity, max: -1, winKFactor: 60, loseKFactor: 10 },
  { name: 'Coal', min: 0, max: 999, winKFactor: 80, loseKFactor: 20 },
  { name: 'Bronze', min: 1000, max: 1099, winKFactor: 80, loseKFactor: 40 },
  { name: 'Silver', min: 1100, max: 1199, winKFactor: 60, loseKFactor: 30 },
  { name: 'Gold', min: 1200, max: 1299, winKFactor: 45, loseKFactor: 25 },
  { name: 'Amethyst', min: 1300, max: 1399, winKFactor: 40, loseKFactor: 30 },
  { name: 'Emerald', min: 1400, max: 1499, winKFactor: 30, loseKFactor: 30 },
  { name: 'Ruby', min: 1500, max: 1599, winKFactor: 20, loseKFactor: 25 },
  { name: 'Diamond', min: 1600, max: Infinity, winKFactor: 10, loseKFactor: 20 },
];

export const getKFactor = (mmr, didWin) => {
  const rank = RANKS.find((r) => mmr >= r.min && mmr <= r.max) || RANKS[0];
  return didWin ? rank.winKFactor : rank.loseKFactor;
};

export const getRankName = (mmr) => {
  const rank = RANKS.find((r) => mmr >= r.min && mmr <= r.max);
  return rank ? rank.name : RANKS[0].name;
};