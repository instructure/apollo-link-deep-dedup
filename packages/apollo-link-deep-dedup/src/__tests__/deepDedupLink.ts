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
import cloneDeep = require('lodash.clonedeep');

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

    // initialize fake cache store
    const author = {
        'id': 1,
        'firstName': 'Tom',
        'lastName': 'Coleman',
        '__typename': 'Author',
    };
    const authorQuery = gql`
        query {
            author {
                id
                firstName
                lastName
            }
        }
    `;
    const authorCache = new InMemoryCache();
    // write query and data to cache
    authorCache.writeQuery({
        query: authorQuery,
        data: {
            author,
        },
    });

    it(`runs query without errors`, done => {
        const link = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                return new Observable(observer => {
                    observer.next({ data: data });
                    observer.complete();
                });
            }),
        ]);
        execute(link, request).subscribe(result => {
            expect(result.data).toEqual(data);
            done();
        });
    });

    it(`bypasses deduplication if forceFetch`, () => {
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

    it(`bypasses non-query operations`, () => {
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
        // cache access functions
        const mockFuncNames = ['extract'];
        const cacheMocks: jest.SpyInstance<any>[] = mockFuncNames.map(funcName =>
            jest.spyOn(cache, funcName as any),
        );
        const link = ApolloLink.from([
            new DeepDedupLink({ cache }),
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

    it(`works as expected if full cache hit`, done => {
        let toHaveBeenCalled = false;
        const initialQuery = cloneDeep(authorQuery);
        const upstreamLink = new ApolloLink((operation, forward) => {
            const downstreamLinkObservable = forward(operation);
            return new Observable(upstreamLinkObserver => {
                // subscribe to result from deepDedupLink
                downstreamLinkObservable.subscribe((downstreamData) => {
                    // assert that the query matches initial query after execution
                    expect(operation.query).toEqual(initialQuery);
                    // pass data to upstream
                    upstreamLinkObserver.next(downstreamData);
                });
            });
        });
        const donwstreamLink = new ApolloLink(() => {
            toHaveBeenCalled = true;
            return new Observable(observer => {
                observer.complete();
            });
        });

        const link = ApolloLink.from([
            upstreamLink,
            new DeepDedupLink({ cache: authorCache }),
            donwstreamLink,
        ]);

        const authorRequest: GraphQLRequest = { query: authorQuery };
        execute(link, authorRequest).subscribe(result => {
            // assert that result is expected
            const expectedAuthorData = {
                author: {
                    'id': 1,
                    'firstName': 'Tom',
                    'lastName': 'Coleman',
                },
            };
            expect(result.data).toEqual(expectedAuthorData);
            // assert that the following link has not been invoked
            expect(toHaveBeenCalled).toBe(false);
            done();
        });
    });

    it(`works as expected if full cache miss`, done => {
        const dataFromResultingLink = { stringData: 'data from resulting link' };
        const initialQuery = cloneDeep(document);
        const upstreamLink = new ApolloLink((operation, forward) => {
            const downstreamLinkObservable = forward(operation);
            return new Observable(upstreamLinkObserver => {
                // subscribe to result from deepDedupLink
                downstreamLinkObservable.subscribe((downstreamData) => {
                    // assert that the query matches initial query after execution
                    expect(operation.query).toEqual(initialQuery);
                    // pass data to upstream
                    upstreamLinkObserver.next(downstreamData);
                });
            });
        });
        const downstreamLink = new ApolloLink((operation) => {
            // assert that query has not been modified
            expect(operation.variables).toBe(request.variables);
            expect(operation.query).toBe(request.query);
            return new Observable(observer => {
                // pass data to upstream deepDedupLink
                observer.next({ data: dataFromResultingLink });
                observer.complete();
            });
        });

        const link = ApolloLink.from([
            upstreamLink,
            new DeepDedupLink({ cache: authorCache }),
            downstreamLink,
        ]);

        // execute request, instead of authorRequest, with authorCache (full cache miss)
        execute(link, request).subscribe(result => {
            // assert that result matches dataFromResultingLink
            expect(result.data).toEqual(dataFromResultingLink);
            done();
        });
    });

    it(`partially deduplicates query`, done => {
        const partiallyResolvableQuery = gql`
            query {
                author {
                    id
                    firstName
                    lastName
                    posts {
                        id
                        title
                    }
                }
            }
        `;
        const initialQuery = cloneDeep(partiallyResolvableQuery);
        const upstreamLink = new ApolloLink((operation, forward) => {
            const downstreamLinkObservable = forward(operation);
            return new Observable(upstreamLinkObserver => {
                // subscribe to result from deepDedupLink
                downstreamLinkObservable.subscribe((downstreamData) => {
                    // assert that the query matches initial query after execution
                    expect(operation.query).toEqual(initialQuery);
                    // pass data to upstream
                    upstreamLinkObserver.next(downstreamData);
                });
            });
        });
        const downstreamLink = new ApolloLink((operation) => {
            return new Observable(observer => {
                const deduplicatedQuery = gql`
                    query {
                        author {
                            posts {
                                id
                                title
                            }
                        }
                    }
                `;

                // assert that query has been deduplicated as expected
                expect(operation.query.definitions).toEqual(deduplicatedQuery.definitions);
                // return data for the deduplicated query
                observer.next({
                    data: {
                        author: {
                            posts: ['post1', 'post2', 'post3'],
                        },
                    },
                });
                observer.complete();
            });
        });

        const link = ApolloLink.from([
            upstreamLink,
            new DeepDedupLink({ cache: authorCache }),
            downstreamLink,
        ]);

        const partiallyResolvableRequest: GraphQLRequest = { query: partiallyResolvableQuery };
        execute(link, partiallyResolvableRequest).subscribe(result => {
            // assert that result is expected
            const expectedResultData = {
                author: {
                    'id': 1,
                    'firstName': 'Tom',
                    'lastName': 'Coleman',
                    'posts': [
                        'post1',
                        'post2',
                        'post3',
                    ],
                },
            };
            expect(result.data).toEqual(expectedResultData);
            done();
        });
    });
});
