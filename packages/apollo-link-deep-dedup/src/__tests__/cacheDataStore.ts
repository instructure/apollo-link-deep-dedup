import 'jest';
import cacheDataStore from '../cacheDataStore';

describe('cacheDataStore', () => {
    const author1Object = {
        'id': 1,
        'firstName': 'Tom',
        'lastName': 'Coleman',
        'posts': [
            {
                'type': 'id',
                'generated': false,
                'id': 'Post:1',
                'typename': 'Post',
            },
        ],
        '__typename': 'Author',
    };

    const post1Object = {
        'id': 1,
        '__typename': 'Post',
        'title': 'Introduction to GraphQL',
        'author': {
            'type': 'id',
            'generated': false,
            'id': 'Author:1',
            'typename': 'Author',
        },
    };

    const seed = {
        'Author:1': author1Object,
        'Post:1': post1Object,
    };

    const store = new cacheDataStore(seed);

    it(`gets correct data from store`, () => {
        // get result
        const author1Result = store.get('Author:1');
        const post1Result = store.get('Post:1');
        const undefinedResult = store.get('undefinedObject');
        // assert
        expect(author1Result).toBe(author1Object);
        expect(post1Result).toBe(post1Object);
        expect(undefinedResult).toBe(undefined);
    });

    it(`toObject returns correct object`, () => {
        const result = store.toObject();
        expect(result).toBe(seed);
    });
});
