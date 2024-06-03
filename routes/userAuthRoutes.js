const express = require('express');
const router = express.Router();


const {RegisterUser} = require('../controllers/user/userAuthController')

router.post("/register",RegisterUser);



module.exports = router;


