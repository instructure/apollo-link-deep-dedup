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
import { DeepDedupLinkOptions } from './types';
import { isQueryOperation } from './utils';

/*
 * Expects context to contain the forceFetch field if no dedup
 */
export class DeepDedupLink extends ApolloLink {
    protected options: DeepDedupLinkOptions;
    protected resultMap: FetchResult;
    protected allResolved: boolean;

    constructor(options: DeepDedupLinkOptions) {
        super();
        this.options = options;
        this.resultMap = {};
        this.allResolved = false;
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
        // Basically at this point (query has gotten passed into the Links), the query's already been validated and GraphQL allows nullable values.
        // if there's any query resolution failure, we will treat them as cache miss, and get out of the way instead of throwing errors
        const deduplicatedOp: Operation = this.deduplicateQuery(operation);

        // Apollo Link uses observable pattern to chain together the links
        // Here's the documentation on zen-observable: https://github.com/zenparsing/zen-observable#api

        // Case A: if query has been fully resolved, complete the operation and pass the result to upstream links
        if (this.allResolved) {
            return new Observable(upstreamLinkObserver => {
                upstreamLinkObserver.next({ data: this.resultMap });
                upstreamLinkObserver.complete();
            });
        }

        // Case B: if query has not been fully resolved, pass deduplicated query to downstream links
        const downstreamLinkObservable = forward(deduplicatedOp);
        // create an Observable for upstream links to subscribe to
        // Here's where we subscribe to the result from downstream links, aggregate the result, and notify the upstream links
        return new Observable(upstreamLinkObserver => {
            // subscribe to the resulting link
            const subscription = downstreamLinkObservable.subscribe({
                next: (data) => upstreamLinkObserver.next(this.aggregateResult(data)), // pass data up to upstream links
                error: upstreamLinkObserver.error.bind(upstreamLinkObserver),
                complete: upstreamLinkObserver.complete.bind(upstreamLinkObserver),
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
        const { cache, cacheConfig } = this.options;
        const store = new cacheDataStore(cache.extract());
        const resolutionContext = {
            store,
            dataIdFromObject: cacheConfig && cacheConfig.dataIdFromObject || null,
            cacheRedirects: cacheConfig && cacheConfig.cacheRedirects || {},
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
