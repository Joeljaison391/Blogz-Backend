const crypto = require('crypto');

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
  };
  

module.exports = { generateResetToken , generateVerificationToken };

