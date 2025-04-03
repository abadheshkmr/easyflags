import api from './api';
import { FeatureFlag } from '../store/slices/flagsSlice';

// Mock data for development
const mockFlags: FeatureFlag[] = [
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
];

const flagService = {
  // Get all feature flags
  getAllFlags: async (tenantId?: string): Promise<FeatureFlag[]> => {
    try {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return mockFlags;
      }

      const url = tenantId ? `/feature-flags?tenantId=${tenantId}` : '/feature-flags';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching flags:', error);
      throw error;
    }
  },

  // Get feature flag by key
  getFlagByKey: async (key: string): Promise<FeatureFlag> => {
    try {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        const flag = mockFlags.find((f) => f.key === key);
        if (!flag) {
          throw new Error(`Flag with key ${key} not found`);
        }
        return flag;
      }

      const response = await api.get(`/feature-flags/key/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching flag with key ${key}:`, error);
      throw error;
    }
  },

  // Create a new feature flag
  createFlag: async (flag: Partial<FeatureFlag>): Promise<FeatureFlag> => {
    try {
      // Mock creation for development
      if (process.env.NODE_ENV === 'development') {
        const newFlag: FeatureFlag = {
          id: Math.random().toString(36).substring(2, 9),
          key: flag.key!,
          name: flag.name!,
          description: flag.description || '',
          enabled: flag.enabled || false,
          tenantId: flag.tenantId || '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          targetingRules: flag.targetingRules || [],
        };
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return newFlag;
      }

      const response = await api.post('/feature-flags', flag);
      return response.data;
    } catch (error) {
      console.error('Error creating flag:', error);
      throw error;
    }
  },

  // Update a feature flag
  updateFlag: async (key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> => {
    try {
      // Mock update for development
      if (process.env.NODE_ENV === 'development') {
        const flagIndex = mockFlags.findIndex((f) => f.key === key);
        if (flagIndex === -1) {
          throw new Error(`Flag with key ${key} not found`);
        }
        
        const updatedFlag = {
          ...mockFlags[flagIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return updatedFlag;
      }

      const response = await api.patch(`/feature-flags/key/${key}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating flag with key ${key}:`, error);
      throw error;
    }
  },

  // Toggle flag enabled status
  toggleFlag: async (key: string, enabled: boolean): Promise<FeatureFlag> => {
    return flagService.updateFlag(key, { enabled });
  },

  // Delete a feature flag
  deleteFlag: async (key: string): Promise<void> => {
    try {
      // Mock deletion for development
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      await api.delete(`/feature-flags/key/${key}`);
    } catch (error) {
      console.error(`Error deleting flag with key ${key}:`, error);
      throw error;
    }
  },

  // Add targeting rule to a flag
  addTargetingRule: async (
    flagKey: string,
    rule: Omit<FeatureFlag['targetingRules'][0], 'id'>
  ): Promise<FeatureFlag> => {
    try {
      // Mock rule addition for development
      if (process.env.NODE_ENV === 'development') {
        const flagIndex = mockFlags.findIndex((f) => f.key === flagKey);
        if (flagIndex === -1) {
          throw new Error(`Flag with key ${flagKey} not found`);
        }
        
        const newRule = {
          ...rule,
          id: Math.random().toString(36).substring(2, 9),
        };
        
        const updatedFlag = {
          ...mockFlags[flagIndex],
          targetingRules: [...mockFlags[flagIndex].targetingRules, newRule],
          updatedAt: new Date().toISOString(),
        };
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return updatedFlag;
      }

      const response = await api.post(`/feature-flags/${flagKey}/targeting-rules`, rule);
      return response.data;
    } catch (error) {
      console.error(`Error adding targeting rule to flag ${flagKey}:`, error);
      throw error;
    }
  },
};

export default flagService; 