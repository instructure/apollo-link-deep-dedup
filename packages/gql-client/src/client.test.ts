import 'jest';

import { client } from './apolloClient';
import {
    fetchAllAuthors,
    fetchAllPosts,
    fetchAuthorById,
    upvotePostByPostId,
} from './queries';

import Author from './models/Author';
import Post from './models/Post';

describe('Client', () => {
    it('fetches all authors', async () => {
        const result = await client.query(fetchAllAuthors());
        const authors: Author[] = result.data as Author[];
        expect(authors).toMatchSnapshot();
    });

    it('fetches all posts', async () => {
        const result = await client.query(fetchAllPosts());
        const posts: Post[] = result.data as Post[];
        expect(posts).toMatchSnapshot();
    });

    it('fetches author by id', async () => {
        const authorId = 1;
        const result = await client.query(fetchAuthorById(authorId));
        const author = result.data as Author;
        expect(author).toMatchSnapshot();
    });

    it('upvotes post by post id', async () => {
        const postId = 1;
        const result = await client.mutate(upvotePostByPostId(postId));
        const upvotedPost: Post = result.data.upvotePost as Post;
        expect(upvotedPost).toHaveProperty('id', postId);
        expect(upvotedPost.votes).toBeGreaterThan(1);
    });
});

