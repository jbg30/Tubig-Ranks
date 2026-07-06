import express from 'express';
import {
  invitePartyMember,
  respondToPartyInvite,
  getMyParty,
  leaveParty,
} from '../controllers/partyController.js';

const router = express.Router();

router.post('/invite', invitePartyMember);
router.post('/respond', respondToPartyInvite);
router.get('/:userId', getMyParty);
router.post('/leave', leaveParty);

export default router;