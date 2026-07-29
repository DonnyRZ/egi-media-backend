const bcrypt = require("bcrypt");

const generateHash = async (plain) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(String(plain ?? ""), salt);
};

const compareHash = async (plain, hash) => {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(String(plain), String(hash));
  } catch {
    return false;
  }
};

module.exports = {
  generateHash,
  compareHash,
};
