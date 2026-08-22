import { Resend } from 'resend';

let resend;
const getResend = () => {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

// Resend's shared sandbox sender; swap for a verified domain address once one is set up.
const FROM_ADDRESS = () => process.env.EMAIL_FROM || 'onboarding@resend.dev';

export const sendVerificationEmail = async (toEmail, verifyUrl) => {
  await getResend().emails.send({
    from: FROM_ADDRESS(),
    to: toEmail,
    subject: 'Verify your Tubig Ranks email',
    html: `<p>Confirm your email to secure your account.</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
  });
};

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  await getResend().emails.send({
    from: FROM_ADDRESS(),
    to: toEmail,
    subject: 'Reset your Tubig Ranks password',
    html: `<p>Click below to reset your password.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
};
