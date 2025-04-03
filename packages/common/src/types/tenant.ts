export interface Tenant {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateTenantDto {
  name: string;
  description?: string;
}

export interface UpdateTenantDto {
  name?: string;
  description?: string;
} 