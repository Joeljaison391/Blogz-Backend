const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const authenticateJWT = require('../middlewares/authenticateJWT');

const {RegisterUser , LoginUser , LogoutUser , RefreshToken  , RequestEmailVerification , ResetPassword , RequestPasswordReset , VerifyEmail} = require('../controllers/user/userAuthController')

router.post("/register",asyncHandler(RegisterUser));
router.post("/login",asyncHandler(LoginUser));
router.post("/logout",authenticateJWT,asyncHandler(LogoutUser));
router.post("/refresh-token",asyncHandler(RefreshToken));
router.post("/request-email-verification",authenticateJWT,asyncHandler(RequestEmailVerification));
router.post("/reset-password",asyncHandler(ResetPassword));
router.post("/request-password-reset",asyncHandler(RequestPasswordReset));
router.post("/verify-email",asyncHandler(VerifyEmail));


module.exports = router;