# apollo-link-deep-dedup

A custom [Apollo Link](https://www.apollographql.com/docs/link/) library for resolving GraphQL query against cache as much as possible and issuing minimal requests.

## Motivation

Apollo client has been developed and consumed by a large GraphQL community. However, the implementation of query processing and cache mechanism result in sending full queries, which can be partially fulfilled by the cached data, to the server over the network every time.

Resolving every query with cached data as much as possible and issuing the minimal request to the server will reduce the size of data transferring over the network, leading to a lower network latency; More importantly, it alleviates the query resolution work on the server on an each-query basis.

## Features

Apollo client writes the data from every query to the cache as normalized objects. For every query, `deepDedupLink`

- resolves the query against the cache
- gets partial results from cache
- removes fully-resolved fields from the query
- sends query to downstream links (e.g. `httpLink` for issuing request to the server)
- merges partial results from both cache and server
- sends full result to upstream links

`deepDedupLink` deduplicates queries thoroughly. Even with very nested queries, it is able to deduplicate the query at every-field level (see below example).

It currently only supports [`apollo-cache-inmemory`](https://github.com/apollographql/apollo-client/tree/master/packages/apollo-cache-inmemory) and bypasses deduplication on fields with `directives` and `fragments`.

## Example

First query

```javascript
authors {
    id
    firstName
    posts {
        id
        votes
    }
}
press {
    name
    address
}
```

Second query without deduplication

```javascript
authors {
    id
    firstName
    lastName
    posts {
        id
        votes
        title
    }
}
press {
    name
    address
}
```

Second query with deduplication (the one that gets sent to the server)

```javascript
authors {
    lastName
    posts {
        title
    }
}
```

## Usage

```javascript
import { DeepDedupLink } from 'apollo-link-deep-dedup';

const cache = new InMemoryCache();
const deepDedupLink = new DeepDedupLink({ cache });
```

Use link with apollo client and other links

```javascript
import ApolloClient from 'apollo-client';
import InMemoryCache from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';

// import DeepDedupLink
import { DeepDedupLink } from 'apollo-link-deep-dedup';

// cache used by apollo client
const cache = new InMemoryCache();

// pass in the cache as an option to initialize deepDedupLink
const deepDedupLink = new DeepDedupLink({ cache });

// inject link
const links = ApolloLink.from([
    // ...(upstreamLinks),
    deepDedupLink,
    // ...(downstreamLinks, e.g. httpLink),
]);

// initialize apollo client with the cache and links
const client = new ApolloClient({
    link: links,
    cache,
});
```

## Options

DeepDedupLink takes an object with one required `cache` option

- `cache`: the same cache object passed in when initialiing `ApolloClient`

## Context

`deepDedupLink` can be overridden by using the context on a per operation basis:

- `forceFetch`: a boolean (defaults to false) to bypass deduplication per request

```javascript
// a query with apollo-client that will not be deduplicated
client.query({
    query: MY_QUERY,
    context: {
        forceFetch: true,
    }
});
```

## Development

```shell
git clone https://github.com/instructure/apollo-link-deep-dedup.git

npm install
npm run watch
```
