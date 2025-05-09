import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendInviteCode = async (email, code) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'AUTOHOME.GLOBAL Invitation Code for Smart Home',
    html: `
      <p>You've been invited to join a Smart Home.</p>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
