import { FetchResult } from 'apollo-link';

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

export interface ExecContext {
    variableValues: VariableMap;
    resolver: Resolver;
    resolutionContext?: any;
}

export interface FieldResult {
    data: FetchResult;
    allResolved: boolean;
}

export type QueryResult = FieldResult; // type alias

// readCacheResolver and cache specific types
export interface CacheDataIdObj {
    type: 'id';
    id: string;
    generated: boolean;
    typename: string | undefined;
}



