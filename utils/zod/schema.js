const {z} = require('zod');



const dateString = z.string().refine((val) => {
  const date = new Date(val);
  return !isNaN(date.getTime());
}, {
  message: "Invalid date format"
}).transform((val) => new Date(val));

const userRegistrationSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.string().default('user'),
    avatarUrl: z.string().url('Invalid URL').optional(),
    githubHandle: z.string().optional(),
    linkedinHandle: z.string().optional(),
    joinedDate: dateString.default(() => new Date()),
    personalWebsite: z.string().url('Invalid URL').optional(),
    education: z.string().optional(),
    workPronoun: z.string().optional(),
    about: z.string().optional(),
    badges: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    availableFor: z.array(z.string()).optional(),
    currentlyHacking: z.string().optional(),
    location: z.string().optional(),
    currentlyLearning: z.string().optional(),
    brandColor: z.string().optional()
  });
  

module.exports = {
    userRegistrationSchema
}
