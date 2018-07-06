import {
    filter,
    find,
} from 'lodash';

import Author from './models/Author';
import Post from './models/Post';
import QueryArgs from './models/QueryArgs';

import {
    authors,
    posts,
} from './data';

export const resolvers = {
    Query: {
        posts: (): Post[] => posts,
        authors: (): Author[] => authors,
        author: (_, { id }: QueryArgs): Author => find(authors, { id }) as Author,
        post: (_, { id }: QueryArgs): Post => find(posts, { id }) as Post,
    },

    Mutation: {
        upvotePost: (_, { postId }: QueryArgs): Post => {
            const post: Post = find(posts, { id: postId }) as Post;
            if (!post) {
                throw new Error(`Couldn't find post with id ${postId}`);
            }
            post.votes += 1;
            return post;
        },
    },

    Author: {
        posts: (author: Author): Post[] => filter(posts, { authorId: author.id }),
    },

    Post: {
        author: (post: Post): Author => find(authors, { id: post.authorId }) as Author,
    },
};
