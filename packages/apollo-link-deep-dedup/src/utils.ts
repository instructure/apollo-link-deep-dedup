import { DocumentNode } from 'graphql';

/**
 * @param {DocumentNode} operationDefinition a GraphQL operation definition
 * @returns {boolean} whether the given operation definition is a query operation type
 */
export const isQueryOperation = (operationDefinition: DocumentNode): boolean =>
    (operationDefinition.definitions[0] as any).operation === 'query';
