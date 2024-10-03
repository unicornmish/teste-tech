const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Tag {
    id: ID!
    name: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    likes: [Tag!]!
    dislikes: [Tag!]!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    addLike(userId: ID!, tagName: String!): User!
    addDislike(userId: ID!, tagName: String!): User!
  }
`);
