const { userRegistrationSchema } = require("../../utils/zod/schema");
const prisma = require("../../config/prismaDb");
const  bcrypt = require('bcryptjs');

const RegisterUser = async (req, res) => {
  try {
    
    const validatedData = userRegistrationSchema.parse(req.body);

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
  } catch (err) {
    if (err.name === 'ZodError') {
      
      const formattedErrors = err.errors.map((error) => {
        return {
          path: error.path.join('.'),
          message: error.message,
        };
      });
      
      res.status(400).json({ message: 'Validation error', errors: formattedErrors });
    } else if (err.message !== 'Validation error') {
      
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
};

module.exports = {
  RegisterUser,
};
