/**
 * Generate sample feature flag definitions for SDK testing
 * This script generates a JSON file with sample flag configurations
 * Run with: node scripts/generate-sample-flags.js
 */

const fs = require('fs');
const path = require('path');

// Define sample flags with various targeting rules and configurations
const sampleFlags = [
  {
    id: '1',
    key: 'new-dashboard',
    name: 'New Dashboard UI',
    description: 'Enables the new dashboard UI with enhanced analytics',
    enabled: true,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    targetingRules: [
      {
        id: '101',
        name: 'Beta Users',
        description: 'Enable for beta users',
        percentage: 100,
        enabled: true,
        conditions: [
          {
            id: '201',
            attribute: 'userRole',
            operator: 'EQUALS',
            value: 'beta',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    key: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enables dark mode across the application',
    enabled: true,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    targetingRules: [],
  },
  {
    id: '3',
    key: 'premium-features',
    name: 'Premium Features',
    description: 'Enables premium features for paying customers',
    enabled: false,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    targetingRules: [
      {
        id: '102',
        name: 'Premium Subscribers',
        description: 'Enable for premium subscribers',
        percentage: 100,
        enabled: true,
        conditions: [
          {
            id: '202',
            attribute: 'subscription',
            operator: 'EQUALS',
            value: 'premium',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    key: 'experimental-api',
    name: 'Experimental API',
    description: 'Enables experimental API endpoints',
    enabled: false,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    targetingRules: [],
  },
  {
    id: '5',
    key: 'geo-targeting',
    name: 'Geo-based Content',
    description: 'Shows region-specific content based on user location',
    enabled: true,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    targetingRules: [
      {
        id: '103',
        name: 'US Users',
        description: 'Enable for users in the United States',
        percentage: 100,
        enabled: true,
        conditions: [
          {
            id: '203',
            attribute: 'location.country',
            operator: 'EQUALS',
            value: 'US',
          },
        ],
      },
      {
        id: '104',
        name: 'EU Users',
        description: 'Enable for 50% of users in the European Union',
        percentage: 50,
        enabled: true,
        conditions: [
          {
            id: '204',
            attribute: 'location.region',
            operator: 'EQUALS',
            value: 'EU',
          },
        ],
      },
    ],
  },
  {
    id: '6',
    key: 'multi-variant',
    name: 'Multi-variant Feature',
    description: 'Multi-variant feature with different values based on user groups',
    enabled: true,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    variants: [
      {
        id: '301',
        key: 'control',
        value: { color: 'blue', size: 'medium' },
      },
      {
        id: '302',
        key: 'treatment-a',
        value: { color: 'red', size: 'large' },
      },
      {
        id: '303',
        key: 'treatment-b',
        value: { color: 'green', size: 'small' },
      },
    ],
    targetingRules: [
      {
        id: '105',
        name: 'New Users',
        description: 'Show variant A to new users',
        percentage: 100,
        enabled: true,
        variant: 'treatment-a',
        conditions: [
          {
            id: '205',
            attribute: 'daysSinceSignup',
            operator: 'LESS_THAN',
            value: '30',
          },
        ],
      },
      {
        id: '106',
        name: 'Power Users',
        description: 'Show variant B to power users',
        percentage: 100,
        enabled: true,
        variant: 'treatment-b',
        conditions: [
          {
            id: '206',
            attribute: 'userType',
            operator: 'EQUALS',
            value: 'power',
          },
        ],
      },
    ],
    defaultVariant: 'control',
  },
];

// Create sample evaluation contexts
const sampleContexts = [
  {
    name: 'Anonymous User',
    context: {
      userId: '',
      anonymous: true,
      sessionId: 'sess_123456789',
    },
  },
  {
    name: 'Regular User',
    context: {
      userId: 'user_123',
      userRole: 'regular',
      email: 'user@example.com',
      location: {
        country: 'US',
        region: 'West',
      },
    },
  },
  {
    name: 'Beta User',
    context: {
      userId: 'user_456',
      userRole: 'beta',
      email: 'beta@example.com',
      daysSinceSignup: 15,
    },
  },
  {
    name: 'Premium User',
    context: {
      userId: 'user_789',
      userRole: 'regular',
      subscription: 'premium',
      email: 'premium@example.com',
    },
  },
  {
    name: 'EU User',
    context: {
      userId: 'user_eu123',
      userRole: 'regular',
      location: {
        country: 'France',
        region: 'EU',
      },
    },
  },
  {
    name: 'Power User',
    context: {
      userId: 'user_power123',
      userType: 'power',
      userRole: 'regular',
      daysSinceSignup: 180,
    },
  },
];

// Generate sample data
const sampleData = {
  flags: sampleFlags,
  contexts: sampleContexts,
  expectedResults: [
    {
      flag: 'new-dashboard',
      contextName: 'Anonymous User',
      expected: false,
      reason: 'Default value for anonymous users',
    },
    {
      flag: 'new-dashboard',
      contextName: 'Regular User',
      expected: false,
      reason: 'User is not in beta group',
    },
    {
      flag: 'new-dashboard',
      contextName: 'Beta User',
      expected: true,
      reason: 'User has beta role',
    },
    {
      flag: 'premium-features',
      contextName: 'Regular User',
      expected: false,
      reason: 'Feature is disabled globally',
    },
    {
      flag: 'premium-features',
      contextName: 'Premium User',
      expected: false,
      reason: 'Feature is disabled globally, even for premium users',
    },
    {
      flag: 'dark-mode',
      contextName: 'Regular User',
      expected: true,
      reason: 'Feature is enabled for all users',
    },
    {
      flag: 'geo-targeting',
      contextName: 'Regular User',
      expected: true,
      reason: 'User is in US',
    },
    {
      flag: 'geo-targeting',
      contextName: 'EU User',
      expected: true,
      reason: '50% of EU users get the feature',
    },
  ],
};

// Write to files
const outputDir = path.join(__dirname, '..', 'packages', 'sdk-js', 'test', 'data');
const outputFile = path.join(outputDir, 'sample-flags.json');

// Ensure the directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the sample data
fs.writeFileSync(outputFile, JSON.stringify(sampleData, null, 2));

console.log(`Sample flag data generated at: ${outputFile}`);

// Also generate a simplified version for client-side SDKs
const clientSampleFlags = sampleFlags.map(flag => ({
  key: flag.key,
  name: flag.name,
  enabled: flag.enabled,
  targetingRules: flag.targetingRules,
  variants: flag.variants,
  defaultVariant: flag.defaultVariant,
}));

const clientOutputFile = path.join(outputDir, 'client-sample-flags.json');
fs.writeFileSync(clientOutputFile, JSON.stringify(clientSampleFlags, null, 2));

console.log(`Client-side sample flag data generated at: ${clientOutputFile}`); 