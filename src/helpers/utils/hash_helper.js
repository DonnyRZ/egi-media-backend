const bcrypt = require("bcrypt");

const generateHash = async (plain) => {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(plain, salt);
};

const compareHash = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = {
  generateHash,
  compareHash,
};
