import {
    graphiqlExpress,
    graphqlExpress,
} from 'apollo-server-express';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { makeExecutableSchema } from 'graphql-tools';
import * as morgan from 'morgan';
import * as winston from 'winston';

// Some fake data
const books = [
    {
        title: "Harry Potter and the Sorcerer's stone",
        author: 'J.K. Rowling',
    },
    {
        title: 'Jurassic Park',
        author: 'Michael Crichton',
    },
];

// The GraphQL schema in string form
const typeDefs = `
    type Query { books: [Book] }
    type Book { title: String, author: String }
  `;

// The resolvers
const resolvers = {
    Query: { books: () => books },
};

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

// Initialize the app
const app = express();

// Add global middlewares.
app.use(morgan(process.env.LOG_FORMAT || 'dev'));

// Construct info logger
const logger: winston.Logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
});
// The GraphQL endpoint
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// Start the server
app.listen(3000, () => {
    logger.info('Go to http://localhost:3000/graphiql to run queries!');
});
