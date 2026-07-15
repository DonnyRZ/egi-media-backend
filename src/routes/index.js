const Auth = require("./auth");
const User = require("./user");
const UserProfile = require("./user_profile");
const Category = require("./category");
const Topic = require("./topic");
const Tag = require("./tag");
const Series = require("./series");
const Article = require("./article");
const Subscription = require("./subscription");

module.exports = (server) => {
  Auth(server);
  User(server);
  UserProfile(server);
  Category(server);
  Topic(server);
  Tag(server);
  Series(server);
  Article(server);
  Subscription(server);
};
