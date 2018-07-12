import { ApolloQueryResult } from 'apollo-client';
import 'jest';

import { cache, client } from '../apolloClient';
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

describe('Client', () => {
    // initialize cache mocks
    const cacheMockDeclarations: MockDeclaration[] = [
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
    const cacheMocks: jest.SpyInstance<any>[] = cacheMockDeclarations.map(declaration =>
        jest.spyOn(cache, declaration.name as any),
    );

    beforeEach(() => {
        cacheMocks.forEach(mock => mock.mockClear());
    });

    let testIndex = 1;
    afterEach(() => {
        reportCacheStatus(testIndex, cacheMockDeclarations, cacheMocks, false);
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
    textIndex: number,
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

    console.log(`TEST ${textIndex} Cache Status:
        ${report}
    `);
};
