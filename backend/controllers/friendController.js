import Friendship from '../models/Friendship.js';
import User from '../models/User.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const { requesterId, recipientUsername } = req.body;

    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (recipient._id.toString() === requesterId) {
      return res.status(400).json({ error: 'You cannot friend yourself' });
    }

    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id },
        { requester: recipient._id, recipient: requesterId },
      ],
    });

    if (existing) {
      return res.status(409).json({ error: `Friend request already ${existing.status}` });
    }

    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipient._id,
    });

    res.status(201).json(friendship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const respondToFriendRequest = async (req, res) => {
  try {
    const { friendshipId, accept } = req.body;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendship.status = accept ? 'accepted' : 'declined';
    await friendship.save();

    res.status(200).json(friendship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    }).populate('requester recipient');

    const friends = friendships.map((f) =>
      f.requester._id.toString() === userId ? f.recipient : f.requester
    );

    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const pending = await Friendship.find({
      recipient: userId,
      status: 'pending',
    }).populate('requester');

    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    await Friendship.findOneAndDelete({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
    });

    res.status(200).json({ status: 'removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};