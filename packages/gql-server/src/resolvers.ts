import { books } from './data';

export const resolvers = {
    Query: { books: () => books },
};
