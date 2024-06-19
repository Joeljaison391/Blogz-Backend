const router = require("express").Router();
const authenticateJWT = require("../middlewares/authenticateJWT")
const asyncHandler = require("../middlewares/asyncHandler");

router.post("/createPost",authenticateJWT, asyncHandler(CreatePost));
router.post("/updatePost",authenticateJWT, asyncHandler(UpdatePost));
router.post("/deletePost",authenticateJWT, asyncHandler(DeletePost));
