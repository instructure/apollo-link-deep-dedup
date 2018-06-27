# apollo-link-deep-dedup

This repo contains source code and test harness (GraphQL server and client) of a custom [Apollo-Link](https://www.apollographql.com/docs/link/) library for combining GraphQL queries and issuing minimal requests.

## Development Guide

### File Structure

There are three packages in the `packages/` folder:

- `apollo-link-deep-dedup`: the core independent package of the implementation of `apollo-link-deep-dedup`
- `gql-client`: simple GraphQL test harness client for making GraphQL requests
- `gql-server`: simple GraphQL test harness server for handling GraphQL requests

Full snapshot of repo structure:

```text
├── README.md
├── lerna.json
├── package-lock.json
├── package.json
├── packages
│   ├── apollo-link-deep-dedup
│   │   ├── README.md
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── __tests__
│   │   │   │   └── deepDedupLink.ts
│   │   │   ├── deepDedupLink.ts
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   ├── gql-client
│   │   ├── README.md
│   │   └── package.json
│   └── gql-server
│       ├── README.md
│       └── package.json
├── tsconfig.json
└── tslint.json
```

### Getting Started

```shell
git clone https://github.com/instructure/apollo-link-deep-dedup.git
```

Each package is independently developed, versioned, and built. There is a specific package-level `README.md` for each of the packages.

On top of that, we use [`Lerna`](https://lernajs.io/) for codebase-level source management:

In the root directory of this repo:

```shell
npm install
```

Useful commands (__in the root directory__):

- `npm run push`: runs auto lint fixs, lint checks, and tests for all packages, and git-push to the remote origin of the current branch (__note:__ direct push to master is prohibited)
- `npm run test`: runs all tests in all packages
- `npm run coverage`: reports test coverages across all packages
- `npm run build`: creates builds for all packages
- `npm run clean`: cleans up all build and compiled artifacts across all packages
