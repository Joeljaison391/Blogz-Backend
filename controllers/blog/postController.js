const prisma = require("../../config/prismaDb");
const {
  CreatePostSchema,
  UpdatePostSchema,
} = require("../../utils/zod/postSchema");

const CreatePost = async (req, res) => {
  try {
    const validateData = CreatePostSchema.parse(req.body);
    const userId = req.user.userId;
    const tagsInput = validateData.tags; // Assume tags are passed as an array of strings

    const newPost = await prisma.$transaction(async (prisma) => {
      // Check if each tag exists; if not, create the tag
      const tags = await Promise.all(
        tagsInput.map(async (tagName) => {
          let tag = await prisma.tag.findUnique({
            where: { name: tagName },
          });

          // If tag doesn't exist, create a new tag
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName },
            });
          }

          return tag;
        })
      );

      // Create the post
      return await prisma.post.create({
        data: {
          title: validateData.title,
          content: validateData.content,
          imageUrl: validateData.imageUrl || null,
          status: validateData.status || "draft",
          publishAt: new Date(),
          authorId: userId,
          tags: {
            connect: tags.map((tag) => ({ tagId: tag.tagId })),
          },
          metadata: validateData.metadata
            ? {
                create: validateData.metadata,
              }
            : undefined,
        },
      });
    });

    return res.status(201).json({
      message: "Post created Successfully",
      postId: newPost.postId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};

const UpdatePost = async (req, res) => {
  try {
    const validatedData = UpdatePostSchema.parse(req.body);
    const postId = req.params.postId;
    const userId = req.user.userId;

    const updatedPost = await prisma.$transaction(async (prisma) => {
      const existingPost = await prisma.post.findUnique({
        where: { postId: parseInt(postId) },
      });
      if (!existingPost) {
        return res.status(404).json({
          message: "Post not found",
        });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({
          message: "You are not authorized to update this post",
        });
      }
      const updatedFields = {};
      if (validatedData.title) {
        updatedFields.title = validatedData.title;
      }
      if (validatedData.content) {
        updatedFields.content = validatedData.content;
      }
      if (validatedData.imageUrl) {
        updatedFields.imageUrl = validatedData.imageUrl;
      }
      if (validatedData.status) {
        updatedFields.status = validatedData.status;
      }
      if (validatedData.tags) {
        updatedFields.tags = {
          set: validatedData.tags.map((tagId) => ({ id: tagId })),
        };
      }

      const updatedPost = await prisma.post.update({
        where: { postId: parseInt(postId)},
        data: updatedFields,
        include: {
          author: true,
          tags: true,
          metadata: true,
        },
      });
      return updatedPost;
    });

    return res.status(200).json({
      message: "Post updated successfully",
      updatedPost,
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message:"Server Error",
      error: error
    })
  }
};

const DeletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.userId;
    const post = await prisma.post.findUnique({
      where: { postId: parseInt(postId) },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post",
      });
    }

    await prisma.post.delete({
      where: { postId: parseInt(postId) },
    });

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};


module.exports = {
  CreatePost,
  UpdatePost,
  DeletePost,
};
