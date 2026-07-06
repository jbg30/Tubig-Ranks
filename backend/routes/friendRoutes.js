import express from 'express';
import {
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend
} from '../controllers/friendController.js';

const router = express.Router();

router.post('/request', sendFriendRequest);
router.post('/respond', respondToFriendRequest);
router.get('/:userId', getFriends);
router.get('/:userId/pending', getPendingRequests);
router.post('/remove', removeFriend);

export default router;