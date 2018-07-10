import 'jest';

import { InMemoryCache } from 'apollo-cache-inmemory';
import {
    ApolloLink,
    DocumentNode,
    execute,
    GraphQLRequest,
    Observable,
} from 'apollo-link';
import gql from 'graphql-tag';

import { DeepDedupLink } from '../deepDedupLink';

describe('DeepDedupLink', () => {
    it(`unsubscribes as needed`, () => {
        const document: DocumentNode = gql`
        query test1($x: String) {
          test(x: $x)
        }
      `;
        const variables = { x: 'Hello World' };

        const request: GraphQLRequest = {
            query: document,
            variables: variables,
        };

        let unsubscribed = false;
        const deduper = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                return new Observable(() => {
                    return () => {
                        unsubscribed = true;
                    };
                });
            }),
        ]);

        const sub = execute(deduper, request).subscribe({});

        sub.unsubscribe();
        expect(unsubscribed).toBe(true);
    });
});
