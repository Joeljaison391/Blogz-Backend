const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const authenticateJWT = require('../middlewares/authenticateJWT');

const {RegisterUser , LoginUser , LogoutUser , RefreshToken  , RequestEmailVerification , ResetPassword , RequestPasswordReset , VerifyEmail , GetUserByEmail} = require('../controllers/user/userAuthController')

router.post("/register",asyncHandler(RegisterUser));
router.post("/login",asyncHandler(LoginUser));
router.post("/logout",authenticateJWT,asyncHandler(LogoutUser));
router.post("/refresh-token",authenticateJWT,asyncHandler(RefreshToken));
router.post("/request-email-verification",authenticateJWT,asyncHandler(RequestEmailVerification));
router.post("/reset-password",authenticateJWT,asyncHandler(ResetPassword));
router.post("/request-password-reset",authenticateJWT,asyncHandler(RequestPasswordReset));
router.post("/verify-email",authenticateJWT,asyncHandler(VerifyEmail));
router.post("/get-user-by-email",authenticateJWT,asyncHandler(GetUserByEmail));


module.exports = router;