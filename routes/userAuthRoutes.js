const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');


const {RegisterUser} = require('../controllers/user/userAuthController')

router.post("/register",asyncHandler(RegisterUser));



module.exports = router;


