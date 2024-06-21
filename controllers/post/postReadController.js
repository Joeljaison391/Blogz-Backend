const prisma = require("../../config/prismaDb");
const { PostIdSchema } = require("../../utils/zod/postSchema");

const GetPostById = async (req, res) => {
  const postId = req.params.postId;
  //const validatedData = PostIdSchema.parse(postId);

  try {
    const post = await prisma.post.findUnique({
      where: { postId: parseInt(postId) },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    return res.status(200).json({
      message: "Post found",
      post: post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error,
    });
  }
};

const GetAllPosts = async (req, res) => {
  const posts = await prisma.post.findMany({});

  try {
    if (!posts) return res.status(404).json({ message: "No Posts found" });

    return res.status(200).json({
      message: `${posts.length} posts found`,
      posts: posts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error,
    });
  }
};


const SearchPost = async (req, res) => {
  try {
    console.log("Search endpoint hit");
    const filter = req.query.filter || "";
    console.log("Filter query: ", filter);

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            title: {
              contains: filter,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: filter,
              mode: 'insensitive'
            }
          },
          {
            author: {
              username: {
                contains: filter,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      select: {
        postId: true,
        title: true,
        content: true,
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return res.json({
      posts: posts.map(post => ({
        postId: post.postId,
        title: post.title,
        content: post.content,
        author: post.author.username
      }))
    });
  } catch (error) {
    console.error("Error fetching posts: ", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

module.exports = {
  GetPostById,
  GetAllPosts,
  SearchPost
};
