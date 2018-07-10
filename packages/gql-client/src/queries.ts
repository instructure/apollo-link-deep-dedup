import gql from 'graphql-tag';

import { MutationOptions, QueryOptions } from 'apollo-client';
import { DocumentNode } from 'graphql';

export const fetchAllPosts = () => {
    return {
        query: gql`
            {
                posts {
                    id
                    title
                    author {
                        id
                    }
                }
            }` as DocumentNode,
    } as QueryOptions;
};

export const fetchAllAuthors = () => {
    return {
        query: gql`
            {
                authors {
                    id
                    firstName
                    lastName
                    posts {
                        id
                    }
                }
            }` as DocumentNode,
    } as QueryOptions;
};

export const fetchAuthorById = (authorId: number) => {
    return {
        query: gql`
            {
                author(id:${authorId}) {
                    id
                    firstName
                    lastName
                    posts {
                        id
                    }
                }
            }` as DocumentNode,
    } as QueryOptions;
};

export const fetchPostById = (postId: number) => {
    return {
        query: gql`
            {
                post(id:${postId}) {
                    id
                    title
                    votes
                    author {
                        id
                    }
                }
            }` as DocumentNode,
    } as QueryOptions;
};

export const upvotePostByPostId = (postId: number) => {
    return {
        mutation: gql`mutation {
                upvotePost(postId:${postId}) {
                    id
                    title
                    votes
                    author {
                        id
                    }
                }
            }` as DocumentNode,
    } as MutationOptions;
};
