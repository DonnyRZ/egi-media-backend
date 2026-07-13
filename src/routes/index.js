const UserProfile = require("./user_profile")
const Category = require("./category")
const Topic = require("./topic")

module.exports = (server) => {
  UserProfile(server);
  Category(server);
  Topic(server);
}