# apollo-link-deep-dedup

An [Apollo-Link](https://www.apollographql.com/docs/link/) library and test harness (GraphQL client and server) for combining GraphQL queries and issuing minimal requests.

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
npm bootstrap
npm start
```

This will install all dependencies for each package.

Useful commands (__in the root directory__):

- `npm run push`: makes sure git is clean, runs linter and `git-push` to the remote origin of the current branch (__note:__ direct push to master is prohibited)
- `npm test`: runs all tests in all packages
- `npm run build`: creates builds for all packages
- `npm run clean`: cleans up all build and compiled artifacts across all packages
