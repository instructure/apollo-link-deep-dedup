import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from "apollo-link-http";
import fetch from 'cross-fetch';

const SERVER_URI = 'http://localhost:3000';
const DATA_API_URI = `${SERVER_URI}/graphql`;

const link = createHttpLink({
    uri: DATA_API_URI,
    fetch: fetch,
});

export const client = new ApolloClient({
    cache: new InMemoryCache(),
    link, // [apollo-http-link]
});
