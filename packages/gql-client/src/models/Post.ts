import Author from './Author';

export default interface Post {
    id: number;
    title: string;
    author: Author;
    votes: number;
}
