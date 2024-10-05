const router = require("express").Router();
const authenticateJWT = require("../middlewares/authenticateJWT")
const asyncHandler = require("../middlewares/asyncHandler");
const {CreatePost, UpdatePost, DeletePost } = require("../controllers/post/postController");
const { GetPostById, GetAllPosts, SearchPost , SearchTags  } = require("../controllers/post/postReadController");

router.post("/createPost",authenticateJWT, asyncHandler(CreatePost));
router.put("/updatePost/:postId",authenticateJWT, asyncHandler(UpdatePost));
router.delete("/deletePost/:postId",authenticateJWT, asyncHandler(DeletePost));
router.get("/getPost/:postId", asyncHandler(GetPostById));
router.get("/getAllPosts", asyncHandler(GetAllPosts))
router.get("/search", asyncHandler(SearchPost))
router.get("/searchTags", asyncHandler(SearchTags))
module.exports = router;