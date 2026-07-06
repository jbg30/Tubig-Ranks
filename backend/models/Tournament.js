import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pending', 'ready', 'active', 'completed', 'bye'],
    default: 'pending',
  },
  round: { type: Number, required: true },
  matchIndex: { type: Number, required: true },
  bracketType: {
    type: String,
    enum: ['winners', 'losers', 'grand-final', 'third-place'],
    default: 'winners',
  },
});

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  format: {
    type: String,
    enum: ['single-elimination', 'double-elimination', 'round-robin'],
    required: true,
  },
  seeding: {
    type: String,
    enum: ['shuffled', 'seeded'],
    default: 'shuffled',
  },
  status: {
    type: String,
    enum: ['registration', 'active', 'completed'],
    default: 'registration',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bracket: [matchSchema],
  currentRound: { type: Number, default: 1 },
  pointsAwarded: { type: Boolean, default: false },
  eloAwarded: { type: Boolean, default: false },
}, { timestamps: true });

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;