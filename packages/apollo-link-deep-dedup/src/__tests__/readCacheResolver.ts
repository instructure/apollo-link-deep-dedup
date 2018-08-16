import 'jest';

import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from 'graphql-tag';
import CacheDataStore from '../cacheDataStore';
import readCacheResolver from '../readCacheResolver';

describe('readCacheResolver', () => {
    // initialize fake cache store
    const postObjectScalar = {
        'type': 'id',
        'generated': false,
        'id': 'Post:1',
        'typename': 'Post',
    };
    const author = {
        'id': 1,
        'firstName': 'Tom',
        'lastName': 'Coleman',
        'post': postObjectScalar,
        '__typename': 'Author',
    };
    const query = gql`
        query {
            author(id:1) {
                id
                firstName
                lastName
                post
            }
        }
    `;
    const cache = new InMemoryCache();

    // write query and data to cache
    cache.writeQuery({
        query,
        data: {
            author,
        },
    });

    // initialize store using cache data and include it in resolutionContext
    const resolutionContext = { store: new CacheDataStore(cache.extract()) };

    it(`returns the correct data with given fieldName and args`, () => {
        // cache specific entry point
        const rootValue = {
            type: 'id',
            id: 'ROOT_QUERY',
        };

        // cache store id object
        const expectedResult = {
            'generated': false,
            'id': 'Author:1',
            'type': 'id',
            'typename': 'Author',
        };

        const result = readCacheResolver(
            'author',
            rootValue,
            { id: 1 }, // variables
            resolutionContext,
        );
        expect(result).toEqual(expectedResult);
    });

    it(`returns undefined if field missing`, () => {
        // cache specific entry point
        const rootValue = {
            type: 'id',
            id: 'ROOT_QUERY',
        };

        const result = readCacheResolver(
            'panda', // missing field in the cache
            rootValue,
            { id: 1 }, // variables
            resolutionContext,
        );
        expect(result).toBe(undefined);
    });

    it(`works with JSON object scalar`, () => {
        // cache specific entry point
        const rootValue = {
            type: 'id',
            id: 'Author:1',
        };

        const result = readCacheResolver( // resolves to a JSON scalar
            'post',
            rootValue,
            null,
            resolutionContext,
        );
        expect(result).toEqual(postObjectScalar);
    });
});
