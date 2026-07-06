export const calculateEloChange = (teamRating, opponentRating, didWin, kFactor) => {
  const expectedResult = 1 / (1 + Math.pow(10, (opponentRating - teamRating) / 400));
  const actualResult = didWin ? 1 : 0;
  return Math.round(kFactor * (actualResult - expectedResult));
};