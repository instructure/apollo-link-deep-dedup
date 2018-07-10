import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import fetch from 'cross-fetch';

import { DeepDedupLink } from '../../apollo-link-deep-dedup/lib/index';

const SERVER_URI = 'http://localhost:3000';
const DATA_API_URI = `${SERVER_URI}/graphql`;

// Initialize client cache
const cache = new InMemoryCache();

// Initialize Apollo Links
const deepDedupLink = new DeepDedupLink({
    cache: cache,
});

const httpLink = createHttpLink({
    uri: DATA_API_URI,
    fetch: fetch,
});

const link = ApolloLink.from([
    deepDedupLink,
    httpLink,
]);

// Initialize Apollo Client
export const client = new ApolloClient({
    cache: cache,
    link, // [apollo-deep-dedup-link, apollo-http-link]
});
