const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const authenticateJWT = require('../middlewares/authenticateJWT');

const {RegisterUser , LoginUser , LogoutUser , RefreshToken  , requestEmailVerification , resetPassword , requestPasswordReset , verifyEmail} = require('../controllers/user/userAuthController')

router.post("/register",asyncHandler(RegisterUser));
router.post("/login",asyncHandler(LoginUser));
router.post("/logout",authenticateJWT,asyncHandler(LogoutUser));

module.exports = router;