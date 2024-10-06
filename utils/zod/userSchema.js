const { z } = require("zod");

const userRegistrationSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.string().default("user"),
  avatarUrl: z.string().url("Invalid URL").optional(),
  githubHandle: z.string().optional(),
  linkedinHandle: z.string().optional(),
  joinedDate: z.string().default(new Date().toISOString()),
  personalWebsite: z.string().url("Invalid URL").optional(),
  education: z.string().optional(),
  workPronoun: z.string().optional(),
  about: z.string().optional(),
  badges: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  availableFor: z.array(z.string()).optional(),
  currentlyHacking: z.string().optional(),
  location: z.string().optional(),
  currentlyLearning: z.string().optional(),
  brandColor: z.string().optional(),
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userLoginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Identifier is required")
    .refine((val) => {
      return emailRegex.test(val) || val.length > 0;
    }, "Identifier must be a valid email or non-empty username"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const resetPaswordSchema = z.object({
  token : z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const userUpdateSchema = z
  .object({
    avatarUrl: z.string().url().optional(),
    githubHandle: z.string().optional(),
    linkedinHandle: z.string().optional(),
    joinedDate: z.string().optional(),
    personalWebsite: z.string().url().optional(),
    education: z.string().optional(),
    workPronoun: z.string().optional(),
    about: z.string().optional(),
    badges: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    availableFor: z.string().optional(),
    currentlyHacking: z.string().optional(),
    location: z.string().optional(),
    currentlyLearning: z.string().optional(),
    brandColor: z.string().optional(),
  })
  .partial();

const postSchema = 

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  resetPaswordSchema,
  userUpdateSchema,
};
