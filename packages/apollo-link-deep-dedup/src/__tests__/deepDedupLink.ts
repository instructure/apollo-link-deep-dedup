import 'jest';

import { InMemoryCache } from 'apollo-cache-inmemory';
import {
    ApolloLink,
    DocumentNode,
    execute,
    GraphQLRequest,
    Observable,
} from 'apollo-link';
import gql from 'graphql-tag';


import { DeepDedupLink } from '../deepDedupLink';

function getOperationName(doc: DocumentNode): string | null {
    let res: string | null = null;
    doc.definitions.forEach(definition => {
        if (definition.kind === 'OperationDefinition' && definition.name) {
            res = definition.name.value;
        }
    });
    return res;
}

describe('DeepDedupLink', () => {
    it(`does not affect different queries`, () => {
        const document: DocumentNode = gql`
        query test1($x: String) {
          test(x: $x)
        }
      `;
        const variables1 = { x: 'Hello World' };
        const variables2 = { x: 'Goodbye World' };

        const request1: GraphQLRequest = {
            query: document,
            variables: variables1,
            operationName: getOperationName(document),
        };

        const request2: GraphQLRequest = {
            query: document,
            variables: variables2,
            operationName: getOperationName(document),
        };

        let called = 0;
        const deduper = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                called += 1;
                return null;
            }),
        ]);

        execute(deduper, request1);
        execute(deduper, request2);
        expect(called).toBe(2);
    });

    it(`can bypass deduplication if desired`, () => {
        const document: DocumentNode = gql`
        query test1($x: String) {
          test(x: $x)
        }
      `;
        const variables1 = { x: 'Hello World' };
        const variables2 = { x: 'Hello World' };

        const request1: GraphQLRequest = {
            query: document,
            variables: variables1,
            operationName: getOperationName(document),
            context: {
                forceFetch: true,
            },
        };

        const request2: GraphQLRequest = {
            query: document,
            variables: variables2,
            operationName: getOperationName(document),
            context: {
                forceFetch: true,
            },
        };

        let called = 0;
        const deduper = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                called += 1;
                return null;
            }),
        ]);

        execute(deduper, request1).subscribe({});
        execute(deduper, request2).subscribe({});
        expect(called).toBe(2);
    });

    it(`unsubscribes as needed`, () => {
        const document: DocumentNode = gql`
        query test1($x: String) {
          test(x: $x)
        }
      `;
        const variables1 = { x: 'Hello World' };
        const variables2 = { x: 'Hello World' };

        const request1: GraphQLRequest = {
            query: document,
            variables: variables1,
            operationName: getOperationName(document),
        };

        const request2: GraphQLRequest = {
            query: document,
            variables: variables2,
            operationName: getOperationName(document),
        };

        let unsubscribed = false;
        const deduper = ApolloLink.from([
            new DeepDedupLink({ cache: new InMemoryCache() }),
            new ApolloLink(() => {
                return new Observable(() => {
                    return () => {
                        unsubscribed = true;
                    };
                });
            }),
        ]);

        const sub1 = execute(deduper, request1).subscribe({});
        const sub2 = execute(deduper, request2).subscribe({});

        sub2.unsubscribe();
        sub1.unsubscribe();

        expect(unsubscribed).toBe(true);
    });
});
