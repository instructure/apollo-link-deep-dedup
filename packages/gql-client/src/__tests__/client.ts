import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloQueryResult } from 'apollo-client';
import * as fetcher from 'cross-fetch';
import 'jest';

import createClient from '../apolloClient';
import {
    fetchAllAuthors,
    fetchAllPosts,
    fetchAuthorById,
    fetchPostById,
    upvotePostByPostId,
} from '../queries';

import Author from '../models/Author';
import Post from '../models/Post';

interface MockDeclaration {
    // name of the function to be mocked on
    name: string;
    // default number of times the func being called (without link) during query execution
    defaultCalledTimes: number;
}

const CACHE_MOCK_DECLARATIONS: MockDeclaration[] = [
    {
        name: 'read',
        defaultCalledTimes: 1,
    },
    {
        name: 'write',
        defaultCalledTimes: 1,
    },
    {
        name: 'readQuery',
        defaultCalledTimes: 0,
    },
    {
        name: 'writeQuery',
        defaultCalledTimes: 0,
    },
    {
        name: 'readFragment',
        defaultCalledTimes: 0,
    },
    {
        name: 'writeFragment',
        defaultCalledTimes: 0,
    },
    {
        name: 'diff',
        defaultCalledTimes: 2,
    },
];

describe('Client', () => {
    const cache = new InMemoryCache();

    // initialize mocks for spying functions
    const cacheMocks: jest.SpyInstance<any>[] = CACHE_MOCK_DECLARATIONS.map(declaration =>
        jest.spyOn(cache, declaration.name as any),
    );
    const fetchMock: jest.SpyInstance<any> = jest.spyOn(fetcher, 'fetch');

    // initialize client
    const client = createClient(cache, fetcher.fetch);

    beforeEach(() => {
        cacheMocks.forEach(mock => mock.mockClear());
        fetchMock.mockClear();
    });

    let testIndex = 0;
    afterEach(() => {
        reportCacheStatus(testIndex, CACHE_MOCK_DECLARATIONS, cacheMocks, false);
        reportFetchStatus(testIndex, fetchMock);
        testIndex++;
    });

    it('fetches all authors', async () => {
        const result: ApolloQueryResult<any> = await client.query(fetchAllAuthors());
        const authors: Author[] = result.data.authors;
        expect(authors).toMatchSnapshot();
    });

    it('fetches all posts', async () => {
        const result: ApolloQueryResult<any> = await client.query(fetchAllPosts());
        const posts: Post[] = result.data.posts;
        expect(posts).toMatchSnapshot();
    });

    it('fetches author by id', async () => {
        const authorId = 1;
        const result: ApolloQueryResult<any> = await client.query(fetchAuthorById(authorId));
        const author: Author = result.data.author;
        expect(author).toMatchSnapshot();
    });

    it('fetches post by id', async () => {
        const postId = 1;
        const result: ApolloQueryResult<any> = await client.query(fetchPostById(postId));
        const post: Post = result.data.post;
        expect(post).toHaveProperty('id', postId);
    });

    it('upvotes post by post id', async () => {
        const postId = 1;
        // get current post
        const postResult: ApolloQueryResult<any> = await client.query(fetchPostById(postId));
        const post: Post = postResult.data.post;
        // upvote post
        const upVoteResult = await client.mutate(upvotePostByPostId(postId));
        const upvotedPost: Post = upVoteResult.data.upvotePost;
        // assert
        const expectedVotes = post.votes + 1;
        expect(upvotedPost.votes).toBe(expectedVotes);
    });
});

const prettyStringifyJSON = (obj: Object) => JSON.stringify(obj, null, 2); // spacing level = 2;

/* tslint:disable:no-console
 * for status info logging
 */
const reportCacheStatus = (
    testIndex: number,
    mockDeclarations: MockDeclaration[],
    cacheMocks: jest.SpyInstance<any>[],
    verbose: boolean, // full inspection of mock
): void => {
    const report = cacheMocks.reduce((prev, curr, idx) => {
        const mockName = mockDeclarations[idx].name;
        const defaultCalledTimes = mockDeclarations[idx].defaultCalledTimes;
        const actualCalledTimes = curr.mock.calls.length;

        let results = prev + `
        ${mockName} has been called ${actualCalledTimes} time(s)`;
        if (actualCalledTimes > defaultCalledTimes) {
            // if there's extra cache access, print args and return vals for inspection
            results += `, which exceeds default called time(s) of ${defaultCalledTimes}
                ARGS:
                ${prettyStringifyJSON(curr.mock.calls)}
                RETURN_VALUE:
                ${prettyStringifyJSON(curr.mock.results)}
                `;
        }
        if (verbose) { // print all mock snapshot if verbose
            results += `FULL MOCK SNAPSHOT: ${prettyStringifyJSON(curr.mock)}`;
        }
        return results;
    }, '');

    // 1-indexed for reporting purposes
    console.log(`TEST ${testIndex + 1} Cache Status:
        ${report}
    `);
};

const reportFetchStatus = (
    textIndex: number,
    fetchMock: jest.SpyInstance<any>,
) => {
    const hasBeenCalled = fetchMock.mock.calls.length > 0;
    const uri = hasBeenCalled ? fetchMock.mock.calls[0][0] : '';
    const query = hasBeenCalled ? fetchMock.mock.calls[0][1].body : '';

    const report = hasBeenCalled ? `Network request has been issued to ${uri}
        Query Body:

        ${prettyStringifyJSON(JSON.parse(query))}
        `
        :
        `No network request has been issued.`;


    console.log(`TEST ${textIndex} Network Fetch Status:

${ report}
`);
};
