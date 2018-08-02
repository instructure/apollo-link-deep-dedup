import 'jest';

import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { isQueryOperation } from '../utils';

describe('isQueryOperation', () => {
    it(`returns true with query operation`, async () => {
        const queryDocument: DocumentNode = gql`
            query test1($x: String) {
                test(x: $x)
            }`;
        const anonymousQueryDocument: DocumentNode = gql`
            {
                test(x: x)
            }`;

        expect(isQueryOperation(queryDocument)).toBeTruthy();
        expect(isQueryOperation(anonymousQueryDocument)).toBeTruthy();
    });

    it(`returns false with non-query operation`, async () => {
        const mutationDocument: DocumentNode = gql`
            mutation test1($x: String) {
                test(x: $x)
            }`;
        const subscriptionDocument: DocumentNode = gql`
            subscription test1($x: String) {
                test(x: $x)
            }`;

        expect(isQueryOperation(mutationDocument)).toBeFalsy();
        expect(isQueryOperation(subscriptionDocument)).toBeFalsy();
    });
});
