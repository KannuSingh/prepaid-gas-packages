import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Prepaid Gas SDK',
  description: 'Privacy-preserving gas payments using Account Abstraction and zero-knowledge proofs',
  logoUrl: '/logo.svg',
  iconUrl: '/icon.png',
  
  // Root directory for pages
  rootDir: '.',
  
  // Navigation sidebar
  sidebar: [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/' },
        { text: 'Installation', link: '/installation' },
        { text: 'Quick Start', link: '/quick-start' },
      ],
    },
    {
      text: 'Core Package',
      items: [
        { text: 'Overview', link: '/core/' },
        { text: 'PrepaidGasPaymaster', link: '/core/client' },
        { text: 'Utilities', link: '/core/utilities' },
        { text: 'Types', link: '/core/types' },
      ],
    },
    {
      text: 'Data Package', 
      items: [
        { text: 'Overview', link: '/data/' },
        { text: 'SubgraphClient', link: '/data/client' },
        { text: 'Query Builders', link: '/data/queries' },
        { text: 'Types', link: '/data/types' },
      ],
    },
    {
      text: 'Guides',
      items: [
        { text: 'Integration Guide', link: '/guides/integration' },
        { text: 'Privacy Best Practices', link: '/guides/privacy' },
        { text: 'Network Configuration', link: '/guides/networks' },
        { text: 'Troubleshooting', link: '/guides/troubleshooting' },
      ],
    },
    {
      text: 'Examples',
      items: [
        { text: 'Basic Usage', link: '/examples/basic' },
        { text: 'Advanced Features', link: '/examples/advanced' },
        { text: 'React Integration', link: '/examples/react' },
      ],
    },
  ],

  // Top navigation
  topNav: [
    { text: 'Guide', link: '/' },
    { text: 'API Reference', link: '/core/' },
    { text: 'Examples', link: '/examples/basic' },
    {
      text: 'Links',
      items: [
        { text: 'GitHub', link: 'https://github.com/your-org/prepaid-gas-packages' },
        { text: 'NPM', link: 'https://www.npmjs.com/package/@prepaid-gas/core' },
      ],
    },
  ],

  // Social links
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/your-org/prepaid-gas-packages',
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
  search: {
    boostDocument(documentId) {
      if (documentId.startsWith('/core/') || documentId.startsWith('/data/')) {
        return 2
      }
      return 1
    },
  },

  // Edit link
  editLink: {
    pattern: 'https://github.com/your-org/prepaid-gas-packages/edit/main/apps/docs/pages/:path',
    text: 'Edit this page on GitHub',
  },
})