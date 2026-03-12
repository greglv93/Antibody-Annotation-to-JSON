# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

It is deployed using a [GitHub Actions workflow](../.github/workflows/deploy-docs.yml). The website build is generated 
as an artifact from this workflow, and the artifact is deployed to the GitHub Pages servers. This avoids bloating the 
repository and cluttering the commit history with a website build directory.

*__Note__: docs under `website/docs` are generated automatically from the root docs, so don't edit them directly.*
The documentation files (e.g. `README.md`, `CONTRIBUTING.md`, `test/README.md`, and `doc/*`) used in the website are 
copied from the project root into `website/docs/` using a ['sync-docs' script](./scripts/sync-docs.cjs), which is 
[configured here](package.json) to run automatically before every build or start-up of a local development server.
The purpose of the sync-docs script is mainly to ensure that relative links inside the markdown docs don't break. The 
script preserves the directory structure of the selected files and rewrites URLs either to match the path of the slug in 
the final website build (for links to other files in the copied group) or to link out to the GitHub URL (for files that 
are not included in the group for the Docusaurus website). 

## Installation

```sh
cd website
npm install
```

## Local Development

```sh
npm start
```

This command builds and serves a local preview of the site (a development server with hot reload).
It first generates static content into the local `build` directory (which is ignored by git), and then starts a local 
development server and opens up a browser window. Most changes are reflected live without having to restart the server.

