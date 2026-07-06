import express from 'express';
import { registerUser, loginUser, getUsers, getUserById, updatePassword, updateUsername, deleteAccount, getPendingApprovals, approveUser, adminResetPassword } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/update-username', updateUsername);
router.post('/update-password', updatePassword);
router.post('/delete-account', deleteAccount);
router.get('/pending/:adminId', getPendingApprovals);
router.post('/approve', approveUser);
router.post('/admin-reset-password', adminResetPassword);

export default router;