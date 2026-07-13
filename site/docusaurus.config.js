// @ts-check
const {themes: prismThemes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CodeRecall',
  tagline: 'Senior-level dev skill refreshers. Offline. Private. Free.',
  favicon: 'img/favicon.png',

  url: 'https://rwaqar960.github.io',
  baseUrl: '/coderecall-content/',
  trailingSlash: false,

  organizationName: 'rwaqar960',
  projectName: 'coderecall-content',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/rwaqar960/coderecall-content/edit/main/courses/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.png',
      navbar: {
        title: 'CodeRecall',
        logo: {alt: 'CodeRecall logo', src: 'img/logo.png'},
        items: [
          {type: 'docSidebar', sidebarId: 'courseSidebar', position: 'left', label: 'Courses'},
          {href: 'https://github.com/rwaqar960/coderecall-app', label: 'App repo', position: 'right'},
          {href: 'https://github.com/rwaqar960/coderecall-content', label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'CodeRecall',
            items: [
              {label: 'Courses', to: '/docs/oop'},
              {label: 'App source', href: 'https://github.com/rwaqar960/coderecall-app'},
              {label: 'Content source', href: 'https://github.com/rwaqar960/coderecall-content'},
            ],
          },
        ],
        copyright:
          'Course content licensed CC BY-NC-SA 4.0. App source licensed MIT. No ads, no accounts, no tracking.',
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
