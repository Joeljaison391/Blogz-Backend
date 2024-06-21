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

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const token = generateResetToken();
  const expires = new Date(Date.now() + 3600000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: expires,
    },
  });
  const text =
    "You requested a password reset. Click the link to reset your password:";
  await sendResetEmail(email, token, text);

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

  res.status(200).json({ message: "Password reset successfully" });
};

module.exports = {
    RequestPasswordReset,
    ResetPassword
}