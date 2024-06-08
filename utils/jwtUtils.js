const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const token = jwt.sign(
    { userId: user.userId, username: user.username, email: user.email },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '1h' }
  );
  return token;
};

module.exports = { generateToken };
