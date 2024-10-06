const prisma = require("../../config/prismaDb");
const { PostIdSchema } = require("../../utils/zod/postSchema");

const GetPostById = async (req, res) => {


  const postId = req.params.postId;
  //const validatedData = PostIdSchema.parse(postId);

  try {
    const post = await prisma.post.findUnique({
      where: { postId: parseInt(postId) },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
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
  const { page = 1, limit = 10 } = req.query;

  try {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || isNaN(parsedLimit)) {
      return res.status(400).json({ message: "Invalid page or limit values" });
    }

    const posts = await prisma.post.findMany({
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const totalPosts = await prisma.post.count();

    if (posts.length === 0) {
      return res.status(404).json({ message: "No Posts found" });
    }

    return res.status(200).json({
      message: `${posts.length} posts found`,
      posts: posts.map(post => ({
        ...post,
        authorName: post.author.username,
      })),
      totalPosts: totalPosts,
      totalPages: Math.ceil(totalPosts / parsedLimit),
      currentPage: parsedPage,
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

const SearchTags = async (req, res) => {
  try {
    const searchInput = req.query.q; // Get the query parameter from the request

    // Find tags starting with the search input
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          startsWith: searchInput,
        },
      },
    });

    return res.status(200).json({
      message: "Tags fetched successfully",
      tags,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};

// get post authors by id as array of author objects
// input will be array of postid
// output will be array of author objects
const GetPostAuthorsById = async (postIdsString) => {
  // convert the string of elements seprated by comma into array of integers
  const postIds = postIdsString.split(',').map(Number);


  try {
    const authors = await prisma.post.findMany({
      where: {
        postId: {
          in: postIds,
        },
      },
      select: {
        author: {
          select: {
            username: true,
            joinedDate: true,
            avatarUrl: true,
          },
        },
      },
    });

    return authors.map(post => post.author);
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching authors");
  }
};


module.exports = {
  GetPostById,
  GetAllPosts,
  SearchPost,
  SearchTags,
  GetPostAuthorsById,
};
