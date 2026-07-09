import express from 'express';
import {
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', protect, sendFriendRequest);
router.post('/respond', protect, respondToFriendRequest);
router.get('/:userId', getFriends);
router.get('/:userId/pending', getPendingRequests);
router.post('/remove', protect, removeFriend);

export default router;