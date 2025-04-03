import api from './api';
import { Tenant } from '../store/slices/tenantsSlice';

// Mock data for development
const mockTenants: Tenant[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Default Organization',
    key: 'default-org',
    description: 'Default organization for the system',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Development Team',
    key: 'dev-team',
    description: 'Development team workspace',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    name: 'Marketing Department',
    key: 'marketing',
    description: 'Marketing department workspace',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const tenantService = {
  // Get all tenants
  getAllTenants: async (): Promise<Tenant[]> => {
    try {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        return mockTenants;
      }

      const response = await api.get('/tenants');
      return response.data;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  },

  // Get tenant by ID
  getTenantById: async (id: string): Promise<Tenant> => {
    try {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        const tenant = mockTenants.find((t) => t.id === id);
        if (!tenant) {
          throw new Error(`Tenant with ID ${id} not found`);
        }
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        return tenant;
      }

      const response = await api.get(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tenant with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new tenant
  createTenant: async (tenant: Partial<Tenant>): Promise<Tenant> => {
    try {
      // Mock creation for development
      if (process.env.NODE_ENV === 'development') {
        const newTenant: Tenant = {
          id: Math.random().toString(36).substring(2, 9),
          key: tenant.key!,
          name: tenant.name!,
          description: tenant.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return newTenant;
      }

      const response = await api.post('/tenants', tenant);
      return response.data;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  },

  // Update a tenant
  updateTenant: async (id: string, updates: Partial<Tenant>): Promise<Tenant> => {
    try {
      // Mock update for development
      if (process.env.NODE_ENV === 'development') {
        const tenantIndex = mockTenants.findIndex((t) => t.id === id);
        if (tenantIndex === -1) {
          throw new Error(`Tenant with ID ${id} not found`);
        }
        
        const updatedTenant = {
          ...mockTenants[tenantIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return updatedTenant;
      }

      const response = await api.patch(`/tenants/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating tenant with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a tenant
  deleteTenant: async (id: string): Promise<void> => {
    try {
      // Mock deletion for development
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      await api.delete(`/tenants/${id}`);
    } catch (error) {
      console.error(`Error deleting tenant with ID ${id}:`, error);
      throw error;
    }
  },
};

export default tenantService; 