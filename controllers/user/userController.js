const { userUpdateSchema } = require("../../utils/zod/schema");
const prisma = require("../../config/prismaDb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../../utils/jwtUtils");
const { sendResetEmail } = require("../../utils/emailUtils");
const { generateVerificationToken } = require("../../utils/tokenUtils");

const RequestEmailVerification = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.authenticated) {
    return res.status(400).json({ message: "User is already verified" });
  }

  const token = generateVerificationToken();
  const expires = new Date(Date.now() + 3600000);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.userId,
      token,
      expiresAt: expires,
    },
  });
  const text =
    "You requested an email verification. Click the link to verify your email:";

  await sendResetEmail(user.email, token, text);

  res.status(200).json({ message: "Verification email sent" });
};

const VerifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  await prisma.user.update({
    where: { userId: verificationToken.userId },
    data: { authenticated: true },
  });

  await prisma.emailVerificationToken.delete({ where: { token } });

  res.status(200).json({ message: "Email verified successfully" });
};

const GetUserByEmail = async (req, res) => {
  const { email } = req.params;

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user });
};

const UpdateUser = async (req, res) => {
  const validatedData = userUpdateSchema.parse(req.body);
  const userId = req.user.userId;

  const updateData = {};
  for (const key in validatedData) {
    if (validatedData[key] !== undefined) {
      updateData[key] = validatedData[key];
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      userId: parseInt(userId),
    },
    data: updateData,
  });

  res
    .status(200)
    .json({ message: "User details updated successfully", user: updatedUser });
};

module.exports = {
    RequestEmailVerification,
    UpdateUser,
    VerifyEmail,
    GetUserByEmail
}