// types
import {
    ApolloLink,
    FetchResult,
    NextLink,
    Observable,
    Operation,
} from 'apollo-link';
import { DocumentNode } from 'graphql';
import {
    DeduplicateQueryResult,
    DeepDedupLinkOptions,
    ExecutionResult,
} from './types';

// util functions
import cloneDeep = require('lodash.clonedeep');
import merge = require('lodash.merge');
import { isQueryOperation } from './utils';

// query deduplication related
import CacheDataStore from './cacheDataStore';
import executeQuery from './queryExecution';
import readCacheResolver from './readCacheResolver';

/*
 * Expects context to contain the forceFetch field if no dedup
 */
export class DeepDedupLink extends ApolloLink {
    protected options: DeepDedupLinkOptions;

    constructor(options: DeepDedupLinkOptions) {
        super();
        this.options = options;
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

        // deep-clone initial query for later query restoration
        const initialQuery = cloneDeep(operation.query);

        // deduplicate query
        // Notes on error handling:
        // Basically at this point (query has gotten passed into the Links), the query's already been validated and GraphQL allows nullable values.
        // if there's any query resolution failure, we will treat them as cache miss, and get out of the way instead of throwing errors
        const {
            deduplicatedOp,
            cacheResult,
        }: DeduplicateQueryResult = this.deduplicateQuery(operation);

        // Apollo Link uses observable pattern to chain together the links
        // Here's the documentation on zen-observable: https://github.com/zenparsing/zen-observable#api

        // Case A: if query has been fully resolved, complete the operation and pass the result to upstream links
        if (cacheResult.allResolved) {
            return new Observable(upstreamLinkObserver => {
                upstreamLinkObserver.next({ data: cacheResult.data });
                upstreamLinkObserver.complete();
            });
        }

        // Case B: if query has not been fully resolved, pass deduplicated query to downstream links
        const downstreamLinkObservable = forward(deduplicatedOp);
        // create an Observable for upstream links to subscribe to
        // Here's where we subscribe to the result from downstream links, aggregate the result, and notify the upstream links
        const thisLinkObservable = new Observable(upstreamLinkObserver => {
            // subscribe to the resulting link
            const subscription = downstreamLinkObservable.subscribe({
                next: (downstreamData) => {
                    // restore deduplicated query back to initial query for writing new data to cache
                    deduplicatedOp.query = initialQuery;

                    // aggregate and pass data up to upstream links
                    upstreamLinkObserver.next(
                        this.aggregateResult(
                            downstreamData,
                            cacheResult,
                        ),
                    );
                },
                error: upstreamLinkObserver.error.bind(upstreamLinkObserver),
                complete: upstreamLinkObserver.complete.bind(upstreamLinkObserver),
            });

            // cleanup function
            return () => {
                // unsubscribe resulting link
                subscription.unsubscribe();
            };
        });
        return thisLinkObservable; // return thisLinkObservable for upstream links to subscribe to
    }

    /**
     * Deduplicates the query in the given operation,
     * and returns a deduplicateQueryResult object containing the deduplicatedOp and cacheResult
     * @param   {Operation} operation Apollo-Link Operation
     * @returns {DeduplicateQueryResult} DeduplicateQueryResult object that contains the deduplicatedOp and cacheResult
     */
    private deduplicateQuery = (operation: Operation): DeduplicateQueryResult => {
        const { cache } = this.options;
        const store = new CacheDataStore(cache.extract());
        const resolutionContext = { store };
        // cache specific entry point
        const rootValue = {
            type: 'id',
            id: 'ROOT_QUERY',
        };

        const cacheResult = executeQuery(
            readCacheResolver,
            operation.query as DocumentNode,
            operation.variables,
            rootValue,
            resolutionContext,
        );

        return {
            deduplicatedOp: operation,
            cacheResult,
        } as DeduplicateQueryResult;
    }

    /**
     * Aggregates the result from the network and the cache, and returns a complete FetchResult
     * @param   {FetchResult} networkResult Apollo-Link FetchResult
     * @param   {ExecutionResult} cacheResult ExecutionResult from the cache
     * @returns {FetchResult} a re-aggregated complete fetchResult
     */
    private aggregateResult = (
        networkResult: FetchResult,
        cacheResult: ExecutionResult,
    ): FetchResult => {
        merge(cacheResult.data, networkResult.data);
        return { data: cacheResult.data } as FetchResult;
    }
}
