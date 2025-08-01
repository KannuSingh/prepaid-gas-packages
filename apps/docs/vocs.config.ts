import { defineConfig } from 'vocs';

export default defineConfig({
  title: 'PrepaidGas',
  description: 'Privacy-preserving gas payments using Account Abstraction and zero-knowledge proofs',
  // logoUrl: '/logo.svg',
  // iconUrl: '/icon.png',

  // Navigation sidebar
  sidebar: [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/' },
        { text: 'Quick Start', link: '/quick-start' },
      ],
    },
    {
      text: 'Demo',
      items: [
        { text: 'Live Demo App', link: 'https://demo.prepaidgas.xyz' },
        { text: 'Demo Video', link: 'https://www.loom.com/share/393f02e7cc62416eb695e51f0dbf72dd' },
      ],
    },
    {
      text: 'Core',
      items: [
        { text: 'SDK Integration', link: '/core/' },
      ],
    },
    // {
    //   text: 'Data Package',
    //   items: [
    //     { text: 'Overview', link: '/data/' },
    //     { text: 'Query API', link: '/data/queries' },
    //   ],
    // },
    {
      text: 'Smart Contracts',
      items: [
        { text: 'Overview', link: '/contracts/' },
        { text: 'OneTimeUse', link: '/contracts/one-time-use' },
        { text: 'GasLimited', link: '/contracts/gas-limited' },
        { text: 'CacheEnabled', link: '/contracts/cache-enabled' },
      ],
    },
    // {
    //   text: 'Guides',
    //   items: [
    //     { text: 'Integration Guide', link: '/guides/integration' },
    //     { text: 'React Setup', link: '/guides/react-setup' },
    //     { text: 'Privacy Best Practices', link: '/guides/privacy' },
    //   ],
    // },
    // {
    //   text: 'Examples',
    //   items: [
    //     { text: 'Basic Usage', link: '/examples/basic' },
    //     { text: 'Advanced Features', link: '/examples/advanced' },
    //     { text: 'React Integration', link: '/examples/react' },
    //   ],
    // },
  ],

  // Top navigation
  topNav: [
    { text: 'Guide', link: '/' },
    { text: 'Demo', link: 'https://demo.prepaidgas.xyz' },
    {
      text: 'GitHub',
      items: [
        { text: 'SDK Packages', link: 'https://github.com/KannuSingh/prepaid-gas-packages' },
        { text: 'Smart Contracts', link: 'https://github.com/KannuSingh/prepaid-gas-paymaster-contracts' },
        { text: 'Subgraph', link: 'https://github.com/KannuSingh/prepaid-gas-paymasters-subgraph' },
      ],
    },
  ],

  // Social links
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/KannuSingh/prepaid-gas-packages',
    },
  ],

  // Theme customization
  theme: {
    accentColor: {
      light: '#3b82f6',
      dark: '#60a5fa',
    },
  },

  // Search
  // search: {
  //   boostDocument(documentId) {
  //     if (documentId.startsWith('/core/') || documentId.startsWith('/data/')) {
  //       return 2
  //     }
  //     return 1
  //   },
  // },

  // Edit link
  // editLink: {
  //   pattern: 'https://github.com/your-org/prepaid-gas-packages/edit/main/apps/docs/pages/:path',
  //   text: 'Edit this page on GitHub',
  // },
});
