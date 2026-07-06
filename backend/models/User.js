import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, // Username is required
    unique: true, // No duplicate usernames allowed
    trim: true, // Remove whitespace from both ends of the string
  },
  password: {
    type: String,
    required: true,
  },
  mmr: {
    type: Number,
    default: 1000, // Default MMR value for new users
  },
  status: {
    type: String,
    enum: ['idle', 'in-party', 'queued', 'in-game'],
    default: 'idle', // Default status for new users
  },
    isPlaced: {
    type: Boolean,
    default: false,
  },
  placementGamesPlayed: {
    type: Number,
    default: 0,
  },
  placementWins: {
    type: Number,
    default: 0,
  },
  placementOpponentMmrs: {
    type: [Number],
    default: [],
  },
  lastMatchEloChange: {
  type: Number,
  default: null,
  },
  lastRankChange: {
  from: { type: String, default: null },
  to: { type: String, default: null },
  },
  isApproved: {
  type: Boolean,
  default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  tournamentPoints: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;