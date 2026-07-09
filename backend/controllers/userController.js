import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({
      username: { $regex: `^${username}$`, $options: 'i' },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    const { password: _, ...userWithoutPassword } = user.toObject();
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

    const { password: _, ...userWithoutPassword } = user.toObject();
    const token = signToken(user._id);
    res.status(200).json({ ...userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
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

    await User.findByIdAndDelete(userId);

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