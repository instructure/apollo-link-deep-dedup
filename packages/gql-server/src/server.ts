import {
    graphiqlExpress,
    graphqlExpress,
} from 'apollo-server-express';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { makeExecutableSchema } from 'graphql-tools';
import * as morgan from 'morgan';
import * as winston from 'winston';

import { resolvers } from './resolvers';
import { schema as typeDefs } from './schema';

const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVER_PORT = NODE_ENV === 'development' ? '3000' : '80';

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

// Initialize the app
const app = express();

// Add global middlewares
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
app.listen(SERVER_PORT, () => {
    const info = NODE_ENV === 'development' ?
        `Go to http://localhost:${SERVER_PORT}/graphiql to run queries!` :
        `Server is listening on port ${SERVER_PORT}`;
    logger.info(info);
});
