import 'jest';

import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { isQueryOperation } from '../utils';

describe('isQueryOperation()', () => {
    it(`returns true with query operation`, () => {
        const queryDocument: DocumentNode = gql`
            query test1($x: String) {
                test(x: $x)
            }`;
        const anonymousQueryDocument: DocumentNode = gql`
            {
                test(x: x)
            }`;

        expect(isQueryOperation(queryDocument)).toBe(true);
        expect(isQueryOperation(anonymousQueryDocument)).toBe(true);
    });

    it(`returns false with non-query operation`, () => {
        const mutationDocument: DocumentNode = gql`
            mutation test1($x: String) {
                test(x: $x)
            }`;
        const subscriptionDocument: DocumentNode = gql`
            subscription test1($x: String) {
                test(x: $x)
            }`;

        expect(isQueryOperation(mutationDocument)).toBe(false);
        expect(isQueryOperation(subscriptionDocument)).toBe(false);
    });
});
