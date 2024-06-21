const { UpdateUser } = require('../controllers/user/userController');
const asyncHandler = require('../middlewares/asyncHandler');
const authenticateJWT = require('../middlewares/authenticateJWT');

const express = require('express');
const router = express.Router();

router.put('/update', authenticateJWT , asyncHandler(UpdateUser));
module.exports = router;