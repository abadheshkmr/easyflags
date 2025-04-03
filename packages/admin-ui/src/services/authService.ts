import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const authService = {
  // Login the user
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      // Store the token
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout the user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear the token
      localStorage.removeItem('token');
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  },

  // For development/testing when server is not available
  mockLogin: (credentials: LoginCredentials): Promise<LoginResponse> => {
    return new Promise((resolve) => {
      // Mock successful login after 500ms
      setTimeout(() => {
        // Check for demo credentials
        if (
          credentials.email === 'admin@example.com' &&
          credentials.password === 'password123'
        ) {
          const mockResponse: LoginResponse = {
            token: 'mock-jwt-token',
            user: {
              id: '1',
              email: 'admin@example.com',
              name: 'Admin User',
              role: 'admin',
            },
          };
          localStorage.setItem('token', mockResponse.token);
          resolve(mockResponse);
        } else {
          throw new Error('Invalid credentials');
        }
      }, 500);
    });
  },
};

export default authService; 