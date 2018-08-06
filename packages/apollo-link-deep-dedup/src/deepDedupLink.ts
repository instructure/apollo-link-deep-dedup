import { ApolloCache } from 'apollo-cache';
import { ApolloReducerConfig } from 'apollo-cache-inmemory';
import {
    ApolloLink,
    FetchResult,
    NextLink,
    Observable,
    Operation,
} from 'apollo-link';
import { DocumentNode } from 'graphql';

import cacheDataStore from './cacheDataStore';
import { executeQuery } from './queryExecution';
import { readCacheResolver } from './readCacheResolver';
import { DeepDedupLinkConfig } from './types';
import { isQueryOperation } from './utils';

/*
 * Expects context to contain the forceFetch field if no dedup
 */
export class DeepDedupLink extends ApolloLink {
    protected cache: ApolloCache<any>;
    protected resultMap: FetchResult;
    protected allResolved: boolean;
    protected cacheConfig?: ApolloReducerConfig;

    constructor(config: DeepDedupLinkConfig) {
        super();
        this.cache = config.cache;
        this.resultMap = {};
        this.allResolved = false;
        this.cacheConfig = config.cacheConfig;
    }

    /**
     * Apollo Link life cycle method:
     * {@link https://www.apollographql.com/docs/link/overview.html#request Apollo Link}
     * @param {Operation} operation Apollo Link Operation
     * @param {NextLink} forward Apollo Link NextLink
     * @returns {Observable<FetchResult>} Apollo Link Observable<FetchResult>
     */
    public request(
        operation: Operation,
        forward: NextLink,
    ): Observable<FetchResult> {
        // directly proceed to downstream links if forceFetch or non-query operation
        if (operation.getContext().forceFetch ||
            !isQueryOperation(operation.query as DocumentNode)
        ) {
            return forward(operation);
        }

        // deduplicate query
        // Notes on error handling:
        // Basically at this point (query has gotten passed into the Links), the query's already been validated and GraphQL allows nullable values,
        // if there's any query resolution failure, we will treat them as cache miss, and get out of the way instead of throwing errors
        const deduplicatedOp: Operation = this.deduplicateQuery(operation);

        // Case A: if query has been fully resolved, complete the operation and pass the result to upstream links
        if (this.allResolved) {
            return new Observable(observer => {
                observer.next({ data: this.resultMap });
                observer.complete();
            });
        }

        // Case B: if query has not been fully resolved, pass deduplicated query to downstream links
        const observable = forward(deduplicatedOp);
        // create an Observable for upstream links to subscribe to
        return new Observable(observer => { // observer here refers to upstream link
            // subscribe to the resulting link
            const subscription = observable.subscribe({ // observable here refers to downstream link
                next: (data) => observer.next(this.aggregateResult(data)), // pass data up to upstream links
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
            });

            // cleanup function
            return () => {
                // unsubscribe resulting link
                subscription.unsubscribe();
            };
        });
    }

    /**
     * @param   {Operation} operation Apollo-Link Operation
     * @returns {Operation} a query-deduplicated operation
     */
    private deduplicateQuery = (operation: Operation): Operation => {
        const store = new cacheDataStore(this.cache.extract());
        const resolutionContext = {
            store,
            dataIdFromObject: this.cacheConfig && this.cacheConfig.dataIdFromObject || null,
            cacheRedirects: this.cacheConfig && this.cacheConfig.cacheRedirects || {},
        };

        // cache specific entry point
        const rootValue = {
            type: 'id',
            id: 'ROOT_QUERY',
        };

        const queryResult = executeQuery(
            readCacheResolver,
            operation.query as DocumentNode,
            operation.variables,
            rootValue,
            resolutionContext,
        );

        this.resultMap = queryResult.data;
        this.allResolved = queryResult.allResolved;
        return operation;
    }

    /**
     * @todo
     *
     * @param   {FetchResult} data Apollo-Link FetchResult
     * @returns {FetchResult} a re-aggregated complete fetchResult
     */
    private aggregateResult = (data: FetchResult): FetchResult => {
        return data;
    }
}
