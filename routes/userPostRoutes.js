const router = require("express").Router();
const authenticateJWT = require("../middlewares/authenticateJWT")
const asyncHandler = require("../middlewares/asyncHandler");
const {CreatePost, UpdatePost, DeletePost } = require("../controllers/blog/postController");
const { GetPostById, GetAllPosts, SearchPost , SearchTags , GetPostAuthorsById  } = require("../controllers/blog/postReadController");

router.post("/createPost",authenticateJWT, asyncHandler(CreatePost));
router.put("/updatePost/:postId",authenticateJWT, asyncHandler(UpdatePost));
router.delete("/deletePost/:postId",authenticateJWT, asyncHandler(DeletePost));
router.get("/getPost/:postId", asyncHandler(GetPostById));
router.get("/getAllPosts", asyncHandler(GetAllPosts))
router.get("/search", asyncHandler(SearchPost))
router.get("/searchTags", asyncHandler(SearchTags))
router.get("/getPostAuthorsById", asyncHandler(GetPostAuthorsById))

module.exports = router;