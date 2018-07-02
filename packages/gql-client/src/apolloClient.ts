import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from "apollo-link-http";

const BASE_URI = 'localhost:3000';
const SERVER_URI = `${BASE_URI}/graphql`;

const link = createHttpLink({
    uri: SERVER_URI,
});

export default new ApolloClient({
    cache: new InMemoryCache(),
    link,
});
