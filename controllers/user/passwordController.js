const { resetPaswordSchema } = require("../../utils/zod/userSchema");
const prisma = require("../../config/prismaDb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../../utils/emailUtils");
const {
  generateResetToken,
  generateVerificationToken,
} = require("../../utils/tokenUtils");

const RequestPasswordReset = async (req, res) => {
  const { email } = req.body;
  console.log("RequestPasswordReset -> email", email)
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  console.log("RequestPasswordReset -> user", user)

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const token = generateResetToken();
  const expires = new Date(Date.now() + 3600000); 
  console.log("RequestPasswordReset -> expires", expires)

  try {
    await prisma.passwordResetToken.create({
      data: {
        userId: user.userId,
        token,
        expiresAt: expires,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
    
  }


  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;

  console.log("RequestPasswordReset -> resetLink", resetLink)
  const subject = "Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      <h2 style="color: #333;">Hello ${user.username},</h2>
      <p>You requested to reset your password. Please click the link below to reset it:</p>
      <a 
        href="${resetLink}" 
        style="display: inline-block; padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;"
      >
        Reset Your Password
      </a>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <br />
      <p>Best regards,</p>
      <p>The Support Team</p>
      <hr />
      <p style="font-size: 12px; color: #999;">If you're having trouble clicking the "Reset Your Password" button, copy and paste the URL below into your web browser:</p>
      <a href="${resetLink}" style="color: #007bff;">${resetLink}</a>
    </div>
  `;

  // Assuming sendResetEmail is set up to accept subject, recipient, and HTML content
  await sendResetEmail(email, subject, html);

  res.status(200).json({ message: "Password reset email sent" });
};


const ResetPassword = async (req, res) => {
  const validatedData = resetPaswordSchema.parse(req.body);

  const { token, password } = validatedData;

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (!resetToken) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);


  try {
    await prisma.$transaction([
      prisma.passwordResetToken.delete({
        where: {
          token,
        },
      }),
      prisma.user.update({
        where: {
          userId: resetToken.userId,
        },
        data: {
          passwordHash: hashedPassword,
        },
      }),
    ]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }


  res.status(200).json({ message: "Password reset successfully" });
};

module.exports = {
    RequestPasswordReset,
    ResetPassword
}