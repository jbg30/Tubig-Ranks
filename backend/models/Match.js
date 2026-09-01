import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  players: [{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: String, enum: ['A', 'B'] },
}],
  mode: {
    type: String, // Game mode
    required: true,
  },
  maxPlayers: {
    type: Number, // Maximum number of players
    required: true,
  },
  status: {
  type: String,
  enum: ['waiting', 'active', 'completed', 'abandoned', 'disputed'],
  default: 'waiting',
},
reports: [{
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winningTeam: { type: String, enum: ['A', 'B'] },
}],
winningTeam: {
  type: String,
  enum: ['A', 'B', null],
  default: null,
},
resolving: {
  type: Boolean,
  default: false,
},
players: [{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: String, enum: ['A', 'B'] },
  eloChange: { type: Number, default: null },
}],
}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);

export default Match;