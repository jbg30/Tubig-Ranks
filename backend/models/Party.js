import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedFriendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pending', 'active'],
    default: 'pending',
  },
}, { timestamps: true });

const Party = mongoose.model('Party', partySchema);

export default Party;