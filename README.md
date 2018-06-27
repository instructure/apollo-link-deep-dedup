# GraphQL Deep Dedup

This repo contains source code and test harness of a custom [Apollo-Link](https://www.apollographql.com/docs/link/) library for GraphQL deduplication

## Development Guide

### File Structure

There are three packages in the `packages/` folder:

- `apollo-link-deep-dedup`: the core independent package of the implementation of `apollo-link-deep-dedup`
- `gql-client`: simple GraphQL test harness client for making GraphQL requests
- `gql-server`: simple GraphQL test harness server for handling GraphQL requests

Full snapshot of the repo structure:

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

Each package is independently developed, versioned, and built. There is a specific package-level `README` for each of the packages for reference.

On top of that, we use [`Lerna`](https://lernajs.io/) for codebase management:

In the root directory of this repo:

```shell
npm install
```

Useful commands (__in the root directory of this repo__):

- `npm run push`: runs auto lint-fixs, lint checks, tests for all packages, and git-push to the remote origin of the current branch (note: direct push to master is prohibited)
- `npm run test`: run all tests for all packages
- `npm run build`: creates builds for all packages
- `npm run clean`: cleans up all build and compiled artifacts across all packages
- `npm run coverage`: reports tests coverages across all packages
- `npm run printDir`: prints the directories/files structure tree of this repo
