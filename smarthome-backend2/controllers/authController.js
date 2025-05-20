import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js'; // Adjust path as needed

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { email, password, name, fullName } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, fullName, password: hashedPassword });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'email', 'fullName', 'name'] // expose only safe fields
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};
