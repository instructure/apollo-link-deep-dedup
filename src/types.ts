import { ApolloCache } from 'apollo-cache';
import {
    FetchResult,
    Operation,
} from 'apollo-link';

// deepDedupLink types
export interface DeepDedupLinkOptions {
    cache: ApolloCache<any>;
}

export interface DeduplicateQueryResult {
    deduplicatedOp: Operation;
    cacheResult: ExecutionResult;
}

// queryExecution types
export type Resolver = (
    fieldName: string,
    rootValue: any,
    args: any,
    resolutionContext?: any,
) => any;

export interface VariableMap { // query variables
    [name: string]: any;
}

export interface ExecutionContext {
    variableValues: VariableMap;
    resolver: Resolver;
    resolutionContext?: any;
}

export interface ExecutionResult {
    data: FetchResult;
    allResolved: boolean;
}

// readCacheResolver and cache specific types
export interface CacheDataIdObj {
    type: 'id';
    id: string;
    generated: boolean;
    typename: string | undefined;
}
