import 'jest';

import { print } from 'graphql';
import gql from 'graphql-tag';
import cloneDeep = require('lodash.clonedeep');
import CacheDataStore from '../cacheDataStore';
import executeQuery from '../queryExecution';
import readCacheResolver from '../readCacheResolver';

describe('executeQuery()', () => {
    // initialize fake cache store
    const cacheDataSeed = {
        'Author:1': {
            'id': 1,
            'firstName': 'Sashko',
            'lastName': 'Stubailo',
            'posts': [
                {
                    'type': 'id',
                    'generated': false,
                    'id': 'Post:1',
                    'typename': 'Post',
                },
                {
                    'type': 'id',
                    'generated': false,
                    'id': 'Post:2',
                    'typename': 'Post',
                },
            ],
            '__typename': 'Author',
        },
        'Post:1': {
            'id': 1,
            '__typename': 'Post',
            'title': 'Welcome to Meteor',
            'votes': 1,
            'author': {
                'type': 'id',
                'generated': false,
                'id': 'Author:1',
                'typename': 'Author',
            },
        },
        'Post:2': {
            'id': 2,
            '__typename': 'Post',
            'title': 'Advanced GraphQL',
            'votes': 2,
            'author': {
                'type': 'id',
                'generated': false,
                'id': 'Author:1',
                'typename': 'Author',
            },
        },
        'ROOT_QUERY': {
            'authors': [
                {
                    'type': 'id',
                    'generated': false,
                    'id': 'Author:1',
                    'typename': 'Author',
                },
            ],
            'posts': [
                {
                    'type': 'id',
                    'generated': false,
                    'id': 'Post:1',
                    'typename': 'Post',
                },
                {
                    'type': 'id',
                    'generated': false,
                    'id': 'Post:2',
                    'typename': 'Post',
                },
                null,
                null,
                null,
            ],
            'author({\"id\":1})': {
                'type': 'id',
                'generated': false,
                'id': 'Author:1',
                'typename': 'Author',
            },
            'nestedPosts': [
                [
                    {
                        'type': 'id',
                        'generated': false,
                        'id': 'Post:1',
                        'typename': 'Post',
                    },
                    {
                        'type': 'id',
                        'generated': false,
                        'id': 'Post:2',
                        'typename': 'Post',
                    },
                ],
                [
                    {
                        'type': 'id',
                        'generated': false,
                        'id': 'Post:1',
                        'typename': 'Post',
                    },
                    {
                        'type': 'id',
                        'generated': false,
                        'id': 'Post:2',
                        'typename': 'Post',
                    },
                ],
            ],
        },
    };
    const store = new CacheDataStore(cacheDataSeed);
    const resolutionContext = { store };

    // cache specific entry point
    const rootValue = {
        type: 'id',
        id: 'ROOT_QUERY',
    };

    it(`works as expected with full cache hit`, () => {
        const query = gql`
            query {
                authors {
                    firstName
                    lastName
                }
            }
        `;

        const expectedResult = {
            'authors': [{
                firstName: 'Sashko',
                lastName: 'Stubailo',
            }],
        };

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(true);
        // assert that selections have all been deduplicated
        expect(query.definitions[0].selectionSet.selections.length).toBe(0);
        // assert that query string is empty
        expect(print(query).trim()).toEqual('');
    });

    it(`works as expected with full cache miss`, () => {
        const query = gql`
            query {
                pandas {
                    firstName
                    lastName
                }
            }
        `;
        const initialQuery = cloneDeep(query);

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        expect(data).toEqual({});
        expect(allResolved).toBe(false);
        // assert that query has not been modified
        expect(query).toEqual(initialQuery);
    });

    it(`bypasses fragments and directives`, () => {
        const querywithFragAndDirect = gql`
            fragment NameParts on Author {
                firstName
                lastName
            }
            query {
                authors {
                    ...NameParts
                    posts @skip(if: true) {
                        title
                    }
                }
            }
        `;
        const initialQuery = cloneDeep(querywithFragAndDirect);

        const result = executeQuery(
            readCacheResolver,
            querywithFragAndDirect,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        expect(data).toEqual({ authors: [{}] });
        expect(allResolved).toBe(false);
        // assert that query has not been modified
        expect(querywithFragAndDirect).toEqual(initialQuery);
    });

    it(`deduplicates basic query`, () => {
        const query = gql`
            query {
                authors {
                    firstName
                    lastName
                    DOB
                }
            }
        `;

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        const expectedResult = {
            'authors': [
                {
                    'firstName': 'Sashko',
                    'lastName': 'Stubailo',
                },
            ],
        };
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(false);

        // assert that query has been deduplicated as expected
        const expectedDeduplicatedQuery = gql`
            query {
                authors {
                    DOB
                }
            }
        `;
        expect(print(query)).toEqual(print(expectedDeduplicatedQuery));
    });

    it(`deduplicates query with variables`, () => {
        const query = gql`
            query ($authorId: Int!)  {
                author(id: $authorId) {
                    firstName
                    lastName
                    DOB
                }
            }
        `;

        const result = executeQuery(
            readCacheResolver,
            query,
            { authorId: 1 },
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        const expectedResult = {
            'author': {
                'firstName': 'Sashko',
                'lastName': 'Stubailo',
            },
        };
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(false);

        // assert that query has been deduplicated as expected
        const expectedDeduplicatedQuery = gql`
            query ($authorId: Int!) {
                author(id: $authorId) {
                    DOB
                }
            }
        `;
        expect(print(query)).toEqual(print(expectedDeduplicatedQuery));
    });

    it(`deduplicates query with nested selectionSet`, () => {
        const query = gql`
            query {
                authors {
                    firstName
                    lastName
                    DOB
                    posts {
                        title
                        createdOn
                    }
                }
            }
        `;

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        const expectedResult = {
            'authors': [
                {
                    'firstName': 'Sashko',
                    'lastName': 'Stubailo',
                    'posts': [
                        {
                            'title': 'Welcome to Meteor',
                        },
                        {
                            'title': 'Advanced GraphQL',
                        },
                    ],
                },
            ],
        };
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(false);

        // assert that query has been deduplicated as expected
        const expectedDeduplicatedQuery = gql`
            query {
                authors {
                    DOB
                    posts {
                        createdOn
                    }
                }
            }
        `;
        expect(print(query)).toEqual(print(expectedDeduplicatedQuery));
    });

    it(`deduplicates query with subSelectedArray`, () => {
        const query = gql`
            query {
                authors {
                    firstName
                    lastName
                    DOB
                    posts {
                        title
                        author {
                            firstName
                        }
                        createdOn
                    }
                    posts {
                        votes
                    }
                }
            }
        `;

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        const expectedResult = {
            'authors': [
                {
                    'firstName': 'Sashko',
                    'lastName': 'Stubailo',
                    'posts': [
                        {
                            'author': {
                                'firstName': 'Sashko',
                            },
                            'title': 'Welcome to Meteor',
                            'votes': 1,
                        },
                        {
                            'author': {
                                'firstName': 'Sashko',
                            },
                            'title': 'Advanced GraphQL',
                            'votes': 2,
                        },
                    ],
                },
            ],
        };
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(false);

        // assert that query has been deduplicated as expected
        const expectedDeduplicatedQuery = gql`
            query {
                authors {
                    DOB
                    posts {
                        createdOn
                    }
                }
            }
        `;
        expect(print(query)).toEqual(print(expectedDeduplicatedQuery));
    });

    it(`deduplicates query with subSelectedArray containing null value`, () => {
        const query = gql`
            query {
                posts {
                    title
                    votes
                    createdOn
                }
            }
        `;

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        const expectedResult = {
            'posts': [
                { title: 'Welcome to Meteor', votes: 1 },
                { title: 'Advanced GraphQL', votes: 2 },
                null,
                null,
                null,
            ],
        };
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(false);

        // assert that query has been deduplicated as expected
        const expectedDeduplicatedQuery = gql`
            query {
                posts {
                    createdOn
                }
            }
        `;
        expect(print(query)).toEqual(print(expectedDeduplicatedQuery));
    });

    it(`deduplicates query with nested subSelectedArray`, () => {
        const query = gql`
            query {
                nestedPosts {
                    title
                    createdOn
                }
            }
        `;

        const result = executeQuery(
            readCacheResolver,
            query,
            {},
            rootValue,
            resolutionContext,
        );
        const { data, allResolved } = result;

        // assert that result is expected
        const expectedResult = {
            'nestedPosts': [
                [
                    { 'title': 'Welcome to Meteor' },
                    { 'title': 'Advanced GraphQL' },
                ],
                [
                    { 'title': 'Welcome to Meteor' },
                    { 'title': 'Advanced GraphQL' },
                ],
            ],
        };
        expect(data).toEqual(expectedResult);
        expect(allResolved).toBe(false);

        // assert that query has been deduplicated as expected
        const expectedDeduplicatedQuery = gql`
            query {
                nestedPosts {
                    createdOn
                }
            }
        `;
        expect(print(query)).toEqual(print(expectedDeduplicatedQuery));
    });
});
