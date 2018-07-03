import Post from './Post';

export default interface Author {
    id: number;
    firstName: string;
    lastName: string;
    posts?: Post; // the list of Posts by this author
}
