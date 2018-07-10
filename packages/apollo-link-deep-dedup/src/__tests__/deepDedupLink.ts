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
    // shared dummy vars
    const document: DocumentNode = gql`
        query test1($x: String) {
        test(x: $x)
        }`;

    const variables = { x: 'Hello World' };
    const request: GraphQLRequest = {
        query: document,
        variables: variables,
    };
    const data = { test: 1 };

    it(`runs query without errors`, async () => {
        const link = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                return new Observable(observer => {
                    observer.next({ data: data });
                    observer.complete();
                });
            }),
        ]);
        execute(link, request).subscribe(result =>
            expect(result).toBeTruthy(),
        );
    });

    it(`bypasses deduplication as desired`, async () => {
        const newRequest = request;
        // add forceFetch rule
        newRequest.context = {
            forceFetch: true,
        };
        const link = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink((operation) => {
                // assert that query has not been modified
                expect(operation.variables).toBe(request.variables);
                expect(operation.query).toBe(request.query);
                return new Observable(observer => {
                    observer.complete();
                });
            }),
        ]);
        execute(link, request);
    });

    it(`unsubscribes as needed`, () => {
        let unsubscribed = false;
        const link = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                return new Observable(() => {
                    // triggered when unsubscribe() gets called
                    return () => {
                        unsubscribed = true;
                    };
                });
            }),
        ]);
        const sub = execute(link, request).subscribe({});
        // unsubscribe
        sub.unsubscribe();
        // assert
        expect(unsubscribed).toBe(true);
    });
});
