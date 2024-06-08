const { userRegistrationSchema , userLoginSchema , resetPaswordSchema  } = require("../../utils/zod/schema");
const prisma = require("../../config/prismaDb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken  } = require("../../utils/jwtUtils");
const { sendResetEmail } = require("../../utils/emailUtils");
const { generateResetToken , generateVerificationToken } = require("../../utils/tokenUtils");

const RegisterUser = async (req, res) => {
  const validatedData = userRegistrationSchema.parse(req.body);

  await prisma.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          { email: validatedData.email },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: "Validation error",
        errors: [
          {
            path:
              existingUser.username === validatedData.username
                ? "username"
                : "email",
            message:
              existingUser.username === validatedData.username
                ? "Username already taken"
                : "Email already in use",
          },
        ],
      });
      throw new Error("Validation error");
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role,
        avatarUrl: validatedData.avatarUrl,
        githubHandle: validatedData.githubHandle,
        linkedinHandle: validatedData.linkedinHandle,
        joinedDate: validatedData.joinedDate,
        personalWebsite: validatedData.personalWebsite,
        education: validatedData.education,
        workPronoun: validatedData.workPronoun,
        about: validatedData.about,
        badges: validatedData.badges,
        skills: validatedData.skills,
        availableFor: validatedData.availableFor,
        currentlyHacking: validatedData.currentlyHacking,
        location: validatedData.location,
        currentlyLearning: validatedData.currentlyLearning,
        brandColor: validatedData.brandColor,
      },
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  });
};

const GoogleAuth = async (req, res) => {
  try {
    const { email, username, avatarUrl } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: "Validation error",
        errors: [
          {
            path: existingUser.username === username ? "username" : "email",
            message:
              existingUser.username === username
                ? "Username already taken"
                : "Email already in use",
          },
        ],
      });
      throw new Error("Validation error");
    }

    await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          avatarUrl,
          role: "user",
        },
      });

      res
        .status(201)
        .json({ message: "User registered successfully", user: newUser });
    });
  } catch (err) {
    if (err.message !== "Validation error") {
      res
        .status(500)
        .json({ message: "Internal server error", error: err.message });
    }
  }
};

const LoginUser = async (req, res) => {
    const validatedData = userLoginSchema.parse(req.body);
   const { identifier, password } = validatedData;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        throw new Error("User not found");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        throw new Error("Invalid credentials");
      }

      const token = generateToken(user);
      

      await tx.loginLog.create({
        data: {
          userId: user.userId,
          ip: req.ip,
          device: req.headers["user-agent"],
          location: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        },
      });


      const existingSession = await tx.session.findFirst({
        where: { userId: user.userId },
      });

      if (existingSession) {
        await tx.session.update({
          where: { sessionId: existingSession.sessionId },
          data: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            expiresAt: new Date(Date.now() + 3600000), 
            sessionData: token,
          },
        });
      } else {
        
        await tx.session.create({
          data: {
            userId: user.userId,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            expiresAt: new Date(Date.now() + 3600000), 
            sessionData: token,
          },
        });
      }

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000, // 1 hour in milliseconds
      });

      res.status(200).json({ message: "Logged in successfully", user });
    });
  
};


const LogoutUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }


  await prisma.session.delete({
    where: {
      sessionData: token,
    },
  });

  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
}


const RefreshToken = async (req, res) => {

  const token = req.cookies.token;

  const session = await prisma.session.findFirst({
    where: {
      sessionData: token,
    },
  });

  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      userId: session.userId,
    },
  });

  const newToken = generateToken(user);

  await prisma.session.update({
    where: {
      sessionId: session.sessionId,
    },
    data: {
      sessionData: newToken,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });

  res.cookie("token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600000, // 1 hour in milliseconds
  });

  res.status(200).json({ message: "Token refreshed" });

}
 
const RequestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
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
 const text = "You requested a password reset. Click the link to reset your password:"
  await sendResetEmail(email, token , text);

  res.status(200).json({ message: 'Password reset email sent' });
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
    return res.status(400).json({ message: 'Invalid or expired token' });
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

  res.status(200).json({ message: 'Password reset successfully' });
};


const RequestEmailVerification = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });


  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'User is already verified' });
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
  const text = "You requested an email verification. Click the link to verify your email:"

  await sendResetEmail(user.email, token , text);

  res.status(200).json({ message: 'Verification email sent' });
};

const VerifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  await prisma.user.update({
    where: { userId: verificationToken.userId },
    data: { authenticated: true },
  });

  await prisma.emailVerificationToken.delete({ where: { token } });

  res.status(200).json({ message: 'Email verified successfully' });
};


const GetUserByEmail = async (req, res) => {
  const { email } = req.params;

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ user });
};

module.exports = {
  RegisterUser,
  LoginUser,
  LogoutUser,
  RefreshToken,
  ResetPassword,
  RequestPasswordReset,
  RequestEmailVerification,
  VerifyEmail,
  GetUserByEmail
};
