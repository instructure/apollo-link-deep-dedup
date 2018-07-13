import {
    ApolloCache,
} from 'apollo-cache';
import {
    ApolloLink,
    FetchResult,
    NextLink,
    Observable,
    Operation,
} from 'apollo-link';

export type DeepDedupLinkConfig = {
    cache: ApolloCache<any>;
};

/*
 * Expects context to contain the forceFetch field if no dedup
 */
export class DeepDedupLink extends ApolloLink {
    protected cache: ApolloCache<any>;

    constructor(config: DeepDedupLinkConfig) {
        super();
        this.cache = config.cache;
    }

    public request(operation: Operation, forward: NextLink): Observable<FetchResult> {
        this.cache.extract();

        // directly proceed to downstream links if forceFetch
        if (operation.getContext().forceFetch) {
            return forward(operation);
        }

        // deduplicate query
        const deduplicatedOps = this.deduplicateQuery(operation);
        // pass deduplicated query to downstream links
        const observable = forward(deduplicatedOps);

        // create an Observable for upstream links to subscribe
        return new Observable(observer => {
            // subscribe to the resulting link
            const subscription = observable.subscribe({
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
        /*
        * 07/13/2018 @leontaolong:
        * Rewrite query operation name for testing query rewriting monitoring
        */
        const name = {
            kind: 'Name',
            value: 'pandalytics_is_ready_for_launch',
        };
        // rewrite operation name
        (operation.query.definitions[0] as any).name = name;
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
