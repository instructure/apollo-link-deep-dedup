import { ApolloQueryResult } from 'apollo-client';
import 'jest';

import { client } from '../apolloClient';
import {
    fetchAllAuthors,
    fetchAllPosts,
    fetchAuthorById,
    fetchPostById,
    upvotePostByPostId,
} from '../queries';

import Author from '../models/Author';
import Post from '../models/Post';

describe('Client', () => {
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
