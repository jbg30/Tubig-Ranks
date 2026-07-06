export const RANKS = [
  { name: 'Coal', min: 0, max: 999, color: '#4b4b4b' },
  { name: 'Bronze', min: 1000, max: 1099, color: '#8b4a2c' },
  { name: 'Silver', min: 1100, max: 1199, color: '#999999' },
  { name: 'Gold', min: 1200, max: 1299, color: '#dab640' },
  { name: 'Amethyst', min: 1300, max: 1399, color: '#9966cc' },
  { name: 'Emerald', min: 1400, max: 1499, color: '#4dbf72' },
  { name: 'Ruby', min: 1500, max: 1599, color: '#af2323' },
  { name: 'Diamond', min: 1600, max: Infinity, color: '#5dd5e8' },
];

export const getRank = (mmr) => {
  return RANKS.find((rank) => mmr >= rank.min && mmr <= rank.max) || RANKS[0];
};

export const RANK_ORDER = RANKS.map((r) => r.name);