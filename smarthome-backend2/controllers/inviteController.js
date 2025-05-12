import { User, EmailVerificationCode, UserHome } from '../models/index.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Helper: generate a 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Configure nodemailer (for testing: use ethereal or Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendInviteCode = async (req, res) => {
  try {
    const { email, homeId, role } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailVerificationCode.create({
      email,
      code,
      purpose: 'home_invite',
      expiresAt,
    });

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: 'AUTOHOME.GLOBAL Invitation Code for Smart Home',
    //   text: `You've been invited to join a Smart Home.\nYour code is: ${code}\nIt expires in 10 minutes.`,
    // });
    await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'AUTOHOME.GLOBAL Invitation Code for Smart Home',
  html: `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5; padding: 32px;">
      <div style="max-width: 500px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); padding: 32px;">
        <h2 style="color: #2B6873; margin-top: 0;">You're Invited to AUTOHOME.<span style="color: black;">GLOBAL</span></h2>
        <p style="font-size: 15px; color: #555;">You've been invited to join a smart home on the AUTOHOME.GLOBAL platform.</p>
        
        <div style="margin: 24px 0; padding: 20px; background-color: #e0f2f1; border-left: 5px solid #2B6873; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #333;">Your invite code is:</p>
          <h1 style="margin: 8px 0 0; color: #2B6873; font-size: 28px; letter-spacing: 2px;">${code}</h1>
        </div>

        <p style="font-size: 14px; color: #777;">This code will expire in <strong>10 minutes</strong>.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />

        <p style="font-size: 13px; color: #999;">If you did not expect this email, you can safely ignore it.</p>
        <p style="font-size: 13px; color: #aaa;">&copy; ${new Date().getFullYear()} AUTOHOME.GLOBAL</p>
      </div>
    </div>
  `
  });

    res.status(200).json({ message: 'Verification code sent to user email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send verification code', error: err.message });
  }
};
export const verifyInviteCode = async (req, res) => {
    try {
      const { email, code, homeId, role } = req.body;
  
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const verification = await EmailVerificationCode.findOne({
        where: {
          email,
          code,
          purpose: 'home_invite',
          used: false,
        },
      });
  
      if (!verification) {
        return res.status(400).json({ message: 'Invalid or expired code' });
      }
  
      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ message: 'Code expired' });
      }
  
      // Check if already assigned
      const existingLink = await UserHome.findOne({
        where: { UserId: user.id, HouseId: homeId },
      });
  
      if (existingLink) {
        return res.status(409).json({ message: 'User already linked to this home' });
      }
  
      // Link user to home
      await UserHome.create({
        UserId: user.id,
        HouseId: homeId,
        role,
      });
  
      // Mark code as used
      verification.used = true;
      await verification.save();
  
      res.status(200).json({ message: 'User successfully added to home' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Verification failed', error: err.message });
    }
  };