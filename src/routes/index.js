const Auth = require("./auth");
const UserProfile = require("./user_profile");
const Category = require("./category");
const Topic = require("./topic");

module.exports = (server) => {
  Auth(server);
  UserProfile(server);
  Category(server);
  Topic(server);
};