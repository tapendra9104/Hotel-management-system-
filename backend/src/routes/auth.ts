import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { createUser, findUserByEmail } from '../lib/user-store';
import { auth, AuthenticatedRequest, signToken } from '../middleware/auth';
import { createObjectIdLike } from '../utils/ids';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body ?? {};

  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide all required fields (name, email, password)'
    });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = findUserByEmail(normalizedEmail);

  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'User already exists with that email'
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const user = createUser({
    id: createObjectIdLike(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(String(password), 10),
    phone: String(phone || '').trim(),
    role: 'user',
    stripeCustomerId: null,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
    return;
  }

  const user = findUserByEmail(String(email).trim().toLowerCase());

  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
    return;
  }

  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.get('/me', auth, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;

