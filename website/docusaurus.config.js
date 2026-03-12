// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const repo = process.env.GITHUB_REPOSITORY?.split('/') || [];
const organizationName = repo[0] || 'local-dev';
const projectName = repo[1] || 'local-project';

const isCI = Boolean(process.env.GITHUB_ACTIONS);

const url = isCI ? `https://${organizationName}.github.io` : 'http://localhost:3000';
const baseUrl = isCI ? `/${projectName}/` : '/';

const primaryDocId = 'README';

const docSlugOverrides = {
  README: '/docs/',
  'test/README': '/docs/test/',
};

const docPath = (docId) => docSlugOverrides[docId] || `/docs/${docId}`;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'JSON Antibody Annotations',
  tagline: 'Documentation for a parser that converts INN antibody annotations into a JSON format',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Sets the production url of the site here
  url: url,
  // Sets the /<baseUrl>/ pathname under which the site is served
  baseUrl: baseUrl,

  // GitHub pages deployment config.
  organizationName: organizationName, // GitHub user name.
  projectName: projectName, // Repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: [
    "docusaurus-json-schema-plugin",
    "@docusaurus/theme-mermaid"
  ],
  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // to re-enable the sidebar, uncomment this line and remove the 'false' line
          // sidebarPath: './sidebars.js',
          sidebarPath: false,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            `https://github.com/${organizationName}/${projectName}/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/favicon.ico',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Home',
        logo: {
          alt: 'Site Logo',
          src: 'img/favicon.svg',
        },
        items: [
          {
            type: 'doc',
            docId: primaryDocId,
            position: 'left',
            label: 'Overview',
          },
          {
            type: 'doc',
            docId: 'doc/annotation_format_mapping',
            position: 'left',
            label: 'Annotation Format Mapping'
          },
          {
            type: 'doc',
            docId: 'doc/json-schema',
            position: 'left',
            label: 'JSON schema'
          },
          {
            type: 'doc',
            docId: 'CONTRIBUTING',
            position: 'left',
            label: 'Contributing'
          },
          {
            type: 'doc',
            docId: 'test/README',
            position: 'left',
            label: 'Testing'
          },
          /*
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Contributing',
          },
          */
          {
            href: `https://github.com/${organizationName}/${projectName}/`,
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Overview',
                to: docPath(primaryDocId),
              },
              {
                label: 'Annotation Format Mapping',
                to: docPath('doc/annotation_format_mapping'),
              },
              {
                label: 'JSON schema',
                to: docPath('doc/json-schema'),
              },
              {
                label: 'Contributing',
                to: docPath('CONTRIBUTING'),
              },
              {
                label: 'Testing',
                to: docPath('test/README'),
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub Discussions',
                href: `https://github.com/${organizationName}/${projectName}/discussions/`,
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub Repo Home',
                href: `https://github.com/${organizationName}/${projectName}/`,
              },
            ],
          },
        ],
        copyright: `Licensed under the MIT License. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
