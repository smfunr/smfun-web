const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// 用户注册
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('walletAddress').matches(/^0x[a-fA-F0-9]{40}$/),
  body('username').optional().isLength({ min: 3, max: 30 }),
  body('inviteCode').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, walletAddress, username, inviteCode } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    const existingWallet = await User.findOne({ where: { walletAddress } });
    if (existingWallet) {
      return res.status(400).json({ message: '钱包地址已被使用' });
    }

    // 处理邀请码
    let invitedBy = null;
    if (inviteCode) {
      const inviter = await User.findOne({ where: { inviteCode } });
      if (inviter) {
        invitedBy = inviter.id;
        // 更新邀请人的邀请计数
        await inviter.update({ inviteCount: inviter.inviteCount + 1 });
      }
    }

    // 创建用户
    const user = await User.create({
      email,
      password,
      walletAddress,
      username: username || `user_${Date.now()}`,
      invitedBy
    });

    // 生成 JWT 令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress,
        membershipLevel: user.membershipLevel,
        points: user.points,
        inviteCode: user.inviteCode
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 用户登录
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({ message: '账户已被禁用' });
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 更新最后登录时间
    await user.update({ lastLogin: new Date() });

    // 生成 JWT 令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress,
        membershipLevel: user.membershipLevel,
        points: user.points,
        totalEarned: user.totalEarned,
        totalInvested: user.totalInvested,
        inviteCode: user.inviteCode,
        inviteCount: user.inviteCount
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 钱包登录（Web3 签名）
router.post('/wallet-login', [
  body('walletAddress').matches(/^0x[a-fA-F0-9]{40}$/),
  body('signature').isString(),
  body('message').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { walletAddress, signature, message } = req.body;

    // TODO: 验证签名
    // 这里需要实现 Web3 签名验证逻辑

    // 查找用户
    let user = await User.findOne({ where: { walletAddress } });

    // 如果用户不存在，创建新用户
    if (!user) {
      user = await User.create({
        email: `${walletAddress}@wallet.sm.fun`,
        password: Math.random().toString(36).slice(2), // 随机密码
        walletAddress,
        username: `wallet_${walletAddress.substring(2, 10)}`,
        walletVerified: true
      });
    }

    // 更新最后登录时间
    await user.update({ lastLogin: new Date(), walletVerified: true });

    // 生成 JWT 令牌
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: '钱包登录成功',
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        membershipLevel: user.membershipLevel,
        points: user.points,
        totalEarned: user.totalEarned,
        totalInvested: user.totalInvested
      }
    });
  } catch (error) {
    console.error('钱包登录错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 管理员登录
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // 检查是否为管理员邮箱
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ message: '管理员权限不足' });
    }

    // 验证密码
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 生成管理员 JWT 令牌
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '管理员登录成功',
      token,
      admin: {
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 生成新令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: '令牌刷新成功',
      token
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 登出
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 在实际应用中，这里可以将令牌加入黑名单
    // 目前前端只需删除本地存储的令牌即可
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
