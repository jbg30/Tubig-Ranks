export const RANKS = [
  { name: 'Unranked', min: -Infinity, max: -1, kFactor: 80 },
  { name: 'Coal', min: 0, max: 999, kFactor: 50 },
  { name: 'Bronze', min: 1000, max: 1099, kFactor: 50 },
  { name: 'Silver', min: 1100, max: 1199, kFactor: 45 },
  { name: 'Gold', min: 1200, max: 1299, kFactor: 35 },
  { name: 'Amethyst', min: 1300, max: 1399, kFactor: 30 },
  { name: 'Emerald', min: 1400, max: 1499, kFactor: 20 },
  { name: 'Ruby', min: 1500, max: 1599, kFactor: 15 },
  { name: 'Diamond', min: 1600, max: Infinity, kFactor: 10 },
];

export const getKFactor = (mmr) => {
  const rank = RANKS.find((r) => mmr >= r.min && mmr <= r.max);
  return rank ? rank.kFactor : RANKS[0].kFactor;
};

export const getRankName = (mmr) => {
  const rank = RANKS.find((r) => mmr >= r.min && mmr <= r.max);
  return rank ? rank.name : RANKS[0].name;
};