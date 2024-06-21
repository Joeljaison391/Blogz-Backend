const { z } = require("zod");

const CreatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(255, "Title cannot exceed 255 characters"),
  content: z.string().min(1, "Content must be at least 1 character"),
  imageUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tags: z.array(z.number().int()).optional(),
  metadata: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.array(z.string()).optional(),
    })
    .optional(),
});

const UpdatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(255, "Title cannot exceed 255 characters")
    .optional(),
  content: z.string().min(1, "Content must be at least 1 character").optional(),
  imageUrl: z.string().optional().nullable().optional(),
  status: z
    .enum(["draft", "published", "archived"])
    .default("draft")
    .optional(),
  tags: z.array(z.number().int()).optional(),
});

const PostIdSchema = z.string().min(1).max(10)

module.exports = {
  CreatePostSchema,
  UpdatePostSchema,
  PostIdSchema
};
