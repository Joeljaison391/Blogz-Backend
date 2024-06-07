const { userRegistrationSchema } = require("../../utils/zod/schema");
const prisma = require("../../config/prismaDb");
const  bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require("../../utils/jwtUtils");

const RegisterUser = async (req, res) => {
    const validatedData = userRegistrationSchema.parse(req.body);
    console.log(validatedData);

    await prisma.$transaction(async (prisma) => {
     
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: validatedData.username },
            { email: validatedData.email }
          ]
        }
      });

      if (existingUser) {
        res.status(400).json({
          message: 'Validation error',
          errors: [
            {
              path: existingUser.username === validatedData.username ? 'username' : 'email',
              message: existingUser.username === validatedData.username 
                        ? 'Username already taken' 
                        : 'Email already in use'
            }
          ]
        });
        throw new Error('Validation error');
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

      res.status(201).json({ message: 'User registered successfully', user: newUser });
    });
};

const GoogleAuth = async (req, res) => {
  try {
    const { email, username, avatarUrl } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({
        message: 'Validation error',
        errors: [
          {
            path: existingUser.username === username ? 'username' : 'email',
            message: existingUser.username === username 
                      ? 'Username already taken' 
                      : 'Email already in use'
          }
        ]
      });
      throw new Error('Validation error');
    }

    await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          avatarUrl,
          role: 'user',
        },
      });

      res.status(201).json({ message: 'User registered successfully', user: newUser });
    });
  } catch (err) {
    if (err.message !== 'Validation error') {
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
};

const LoginUser = async (req, res) => {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier }
      ]
    }
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = generateToken(user);


  const loginLog = await prisma.loginLog.create({
    data: {
      userId: user.id,
      ip: req.ip,
      device: req.headers['user-agent'],
      location: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
  });

  if (!loginLog) {
    res.status(500)
    return;
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict',
    maxAge: 3600000, 
  });

  res.status(200).json({ message: 'Logged in successfully', user });
};


module.exports = {
  RegisterUser,
  LoginUser,
};
