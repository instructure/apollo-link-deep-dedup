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
        const newRequest = Object.assign({}, request);
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
        execute(link, newRequest);
    });

    it(`bypasses non-query operations`, async () => {
        const mutationDocument: DocumentNode = gql`
        mutation test1($x: String) {
            test(x: $x) {
                id
            }
        }`;

        const mutationVariables = { x: 'Hello World' };
        const mutationRequest: GraphQLRequest = {
            query: mutationDocument,
            variables: mutationVariables,
        };
        const link = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink((operation) => {
                // assert that query has not been modified
                expect(operation.variables).toBe(mutationRequest.variables);
                expect(operation.query).toBe(mutationRequest.query);
                return new Observable(observer => {
                    observer.complete();
                });
            }),
        ]);
        execute(link, mutationRequest);
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

    it(`accesses cache`, () => {
        const cache = new InMemoryCache();
        // list of cache access functions,
        // which will be specifically determined based on actual implementation later
        const mockFuncNames = ['read', 'diff', 'readQuery', 'readFragment', 'extract'];
        const cacheMocks: jest.SpyInstance<any>[] = mockFuncNames.map(funcName =>
            jest.spyOn(cache, funcName as any),
        );
        const link = ApolloLink.from([
            new DeepDedupLink({ cache: cache }),
            new ApolloLink(() => {
                let toHaveBeenCalled = false;
                // inspect mocks in the following link
                cacheMocks.forEach(mockFunc => {
                    if (mockFunc.mock.calls.length > 0) {
                        toHaveBeenCalled = true;
                    }
                });
                // assert
                expect(toHaveBeenCalled).toBe(true);
                return new Observable(observer => {
                    observer.complete();
                });
            }),
        ]);
        execute(link, request);
    });
});
