import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

//Initializations
const app = express();
import './database';
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers['authorization'];
    if (token !== "null") {
      try {
        const currentUser = await jwt.verify(token, process.env.SECRECT);
        req.currentUser = currentUser;
        return {
          currentUser
        }
      } catch (err) {
        console.error(err);
      }
    }
}});

//Settings
app.set('port', 4000);

//Middlewares
server.applyMiddleware({ app });

//Start Server
app.listen(app.get('port'), () => {
  console.log(`Server >>> http://localhost:${app.get('port') + server.graphqlPath}`)
});