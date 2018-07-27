import { ApolloCache } from 'apollo-cache';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';

import { DeepDedupLink } from '../../apollo-link-deep-dedup/lib/index';

const SERVER_URI = 'http://localhost:3000';
const DATA_API_URI = `${SERVER_URI}/graphql`;

type FetchFunction = (
    input?: string | Request | undefined,
    init?: RequestInit | undefined,
) => Promise<Response>;

const createClient = (cache: ApolloCache<any>, fetch: FetchFunction) => {
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
    return new ApolloClient({
        cache: cache,
        link,
    });
};

export default createClient;
