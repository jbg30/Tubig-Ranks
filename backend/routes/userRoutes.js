import express from 'express';
import { registerUser, loginUser, getUsers, getUserById, updatePassword, updateUsername, deleteAccount, getPendingApprovals, approveUser, adminResetPassword, linkEmail, verifyEmail, forgotPassword, resetPassword } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', protect, getUsers);
router.get('/:id', getUserById);
router.post('/update-username', protect, updateUsername);
router.post('/update-password', protect, updatePassword);
router.post('/delete-account', protect, deleteAccount);
router.get('/pending/:adminId', protect, getPendingApprovals);
router.post('/approve', protect, approveUser);
router.post('/admin-reset-password', protect, adminResetPassword);
router.post('/link-email', protect, linkEmail);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;