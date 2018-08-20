# apollo-link-deep-dedup

A custom [Apollo-Link](https://www.apollographql.com/docs/link/) library for resolving GraphQL query against cache as much as possible and issuing minimal requests.

Apollo Link is a standard interface for modifying control flow of GraphQL requests and fetching GraphQL results. The architecture and concept can be found [here](https://www.apollographql.com/docs/link/overview.html).

## Development Guide

### File Structure


```text
├── Jenkinsfile
├── README.md
├── package-lock.json
├── package.json
├── rollup.config.js
├── src
│   ├── __tests__
│   │   ├── cacheDataStore.ts
│   │   ├── deepDedupLink.ts
│   │   ├── queryExecution.ts
│   │   ├── readCacheResolver.ts
│   │   └── utils.ts
│   ├── cacheDataStore.ts
│   ├── deepDedupLink.ts
│   ├── index.ts
│   ├── queryExecution.ts
│   ├── readCacheResolver.ts
│   ├── types.ts
│   └── utils.ts
├── tsconfig.json
└── tslint.json
```

### Getting Started

```shell
git clone https://github.com/instructure/apollo-link-deep-dedup.git
```


### Getting started

```shell
npm install
npm run watch
```

### Test

```shell
npm test
```

### Lint check

```shell
npm run lint
```

### Lint auto-fix

```shell
npm run lint-fix
```

### Build

```shell
npm run build
```

### Clean up build and coverage artifacts

```shell
npm run clean
```

### Push to origin non-master branch

```shell
npm run push
```
