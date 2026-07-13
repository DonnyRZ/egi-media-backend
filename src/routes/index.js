const Auth = require("./auth");
const User = require("./user");
const UserProfile = require("./user_profile");
const Category = require("./category");
const Topic = require("./topic");
const Tag = require("./tag");

module.exports = (server) => {
  Auth(server);
  User(server);
  UserProfile(server);
  Category(server);
  Topic(server);
  Tag(server);
};
