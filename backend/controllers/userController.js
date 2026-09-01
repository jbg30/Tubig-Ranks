import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import Party from '../models/Party.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { removeUserFromQueue } from './queueController.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createEmailVerifyToken = (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.emailVerifyTokenHash = hashToken(rawToken);
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return rawToken;
};

const createPasswordResetToken = (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return rawToken;
};

export const registerUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const existingUser = await User.findOne({
      username: { $regex: `^${username}$`, $options: 'i' },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, email });

    const rawToken = createEmailVerifyToken(user);
    await user.save();
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    const { password: _, emailVerifyTokenHash, passwordResetTokenHash, ...userWithoutPassword } = user.toObject();
    const token = signToken(user._id);
    res.status(201).json({ ...userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({
      username: { $regex: `^${username}$`, $options: 'i' },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const { password: _, emailVerifyTokenHash, passwordResetTokenHash, ...userWithoutPassword } = user.toObject();
    const token = signToken(user._id);
    res.status(200).json({ ...userWithoutPassword, token, needsEmailLink: !user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const { userId, newUsername } = req.body;

    if (!newUsername) {
      return res.status(400).json({ error: 'New username is required' });
    }

    const existingUser = await User.findOne({
      username: { $regex: `^${newUsername}$`, $options: 'i' },
    });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true }
    ).select('-password');

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ status: 'updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    removeUserFromQueue(userId);

    await Friendship.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] });
    await Party.deleteMany({ $or: [{ leader: userId }, { members: userId }] });

    const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    user.username = `deleted_user_${user._id.toString().slice(-8)}`;
    user.password = unusablePassword;
    user.email = undefined;
    user.emailVerified = false;
    user.emailVerifyTokenHash = null;
    user.emailVerifyExpires = null;
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    user.status = 'idle';
    user.isApproved = false;
    user.isDeleted = true;
    await user.save();

    res.status(200).json({ status: 'deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingApprovals = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const pending = await User.find({ isApproved: false }).select('-password');
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { adminId, userId } = req.body;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isApproved: true },
      { new: true }
    ).select('-password');

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminResetPassword = async (req, res) => {
  try {
    const { adminId, targetUserId, newPassword } = req.body;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be provided' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(targetUserId, { password: hashedPassword });

    res.status(200).json({ status: 'reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const linkEmail = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.email) {
      return res.status(409).json({ error: 'Account already has an email linked' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    user.email = email;
    const rawToken = createEmailVerifyToken(user);
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    res.status(200).json({ status: 'linked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    user.emailVerified = true;
    user.emailVerifyTokenHash = null;
    user.emailVerifyExpires = null;
    await user.save();

    res.status(200).json({ status: 'verified' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond 200 regardless of whether the account exists, to avoid leaking which emails are registered.
    if (!user) {
      return res.status(200).json({ status: 'sent' });
    }

    const rawToken = createPasswordResetToken(user);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError.message);
    }

    res.status(200).json({ status: 'sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Token and a valid new password are required' });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ status: 'reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};