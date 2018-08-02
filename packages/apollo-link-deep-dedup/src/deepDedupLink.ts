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
import { isQueryOperation } from './utils';

export type DeepDedupLinkConfig = {
    cache: ApolloCache<any>;
    cacheConfig?: ApolloReducerConfig,
};

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

    public request(
        operation: Operation,
        forward: NextLink,
    ): Observable<FetchResult> {
        // directly proceed to downstream links if forceFetch
        // bypass non-query operations
        if (operation.getContext().forceFetch ||
            !isQueryOperation(operation.query as DocumentNode)
        ) {
            return forward(operation);
        }

        // deduplicate query
        let deduplicatedOp: Operation;
        try {
            deduplicatedOp = this.deduplicateQuery(operation);
        } catch (err) {
            return new Observable(observer => {
                observer.error({ error: err });
                observer.complete();
            });
        }

        if (this.allResolved) {
            return new Observable(observer => {
                observer.next({ data: this.resultMap });
                observer.complete();
            });
        }

        // pass deduplicated query to downstream links
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
     * @todo
     *
     * @param   {Operation} operation Apollo-Link Operation
     * @returns {Operation} a query-deduplicated operation
     */
    private deduplicateQuery = (operation: Operation): Operation => {
        // /*
        // * 07/13/2018 @leontaolong:
        // * Rewrite query operation name for testing query rewriting monitoring
        // */
        // const name = {
        //     kind: 'Name',
        //     value: 'pandalytics_is_ready_for_launch',
        // };
        // // rewrite operation name
        // (operation.query.definitions[0] as any).name = name;

        const store = new cacheDataStore(this.cache.extract());
        const resolutionContext = {
            store,
            dataIdFromObject: this.cacheConfig && this.cacheConfig.dataIdFromObject || null,
            cacheRedirects: this.cacheConfig && this.cacheConfig.cacheRedirects || {},
        };

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
