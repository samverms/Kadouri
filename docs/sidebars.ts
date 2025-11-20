import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'User Guide',
      items: [
        'user-guide/overview',
        'user-guide/logging-in',
        'user-guide/dashboard',
        'user-guide/managing-accounts',
        'user-guide/managing-products',
        'user-guide/creating-orders',
        'user-guide/viewing-reports',
        'user-guide/user-settings',
        'user-guide/faq',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started (Developers)',
      items: [
        'getting-started/installation',
        'getting-started/environment-setup',
        'getting-started/first-run',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/monorepo-structure',
        'architecture/database-schema',
        'architecture/authentication',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/accounts',
        'features/orders',
        'features/products',
        'features/quickbooks-sync',
        'features/pdf-generation',
        'features/rbac',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/overview',
        'api/accounts',
        'api/orders',
        'api/products',
        'api/roles',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/commands',
        'development/workflows',
        'development/testing',
        'development/debugging',
      ],
    },
  ],
};

export default sidebars;
