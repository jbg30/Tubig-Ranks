import Party from '../models/Party.js';
import User from '../models/User.js';
import { removePartyFromQueue } from './queueController.js';

export const invitePartyMember = async (req, res) => {
  try {
    const { leaderId, friendId } = req.body;

    const existingParty = await Party.findOne({
      status: { $in: ['pending', 'active'] },
      $or: [{ leader: leaderId }, { members: leaderId }],
    });
    if (existingParty) {
      return res.status(409).json({ error: 'You are already in a party' });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }
    if (friend.status !== 'idle') {
      return res.status(400).json({ error: 'Friend is not available right now' });
    }

    const party = await Party.create({
      leader: leaderId,
      members: [leaderId],
      invitedFriendId: friendId,
    });

    res.status(201).json(party);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const respondToPartyInvite = async (req, res) => {
  try {
    const { partyId, userId, accept } = req.body;

    const party = await Party.findById(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party invite not found' });
    }

    if (!accept) {
      await Party.findByIdAndDelete(partyId);
      return res.status(200).json({ status: 'declined' });
    }

    party.members.push(userId);
    party.status = 'active';
    await party.save();

    await User.updateMany(
      { _id: { $in: party.members } },
      { status: 'in-party' }
    );

    res.status(200).json({ status: 'accepted', party });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyParty = async (req, res) => {
  try {
    const { userId } = req.params;

    const party = await Party.findOne({
      status: { $in: ['pending', 'active'] },
      $or: [{ leader: userId }, { members: userId }, { invitedFriendId: userId }],
    }).populate('leader members invitedFriendId');

    res.status(200).json(party);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveParty = async (req, res) => {
  try {
    const { userId } = req.body;

    const party = await Party.findOne({
      $or: [{ leader: userId }, { members: userId }, { invitedFriendId: userId }],
    });

    if (party) {
      await removePartyFromQueue(party._id.toString());
      await User.updateMany(
        { _id: { $in: party.members } },
        { status: 'idle' }
      );
      await Party.deleteOne({ _id: party._id });
    }

    res.status(200).json({ status: 'left' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};