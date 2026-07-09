import express from 'express';
import {
  invitePartyMember,
  respondToPartyInvite,
  getMyParty,
  leaveParty,
} from '../controllers/partyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/invite', protect, invitePartyMember);
router.post('/respond', protect, respondToPartyInvite);
router.get('/:userId', getMyParty);
router.post('/leave', protect, leaveParty);

export default router;