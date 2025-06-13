
export interface AdminUser {
  id: string;
  email: string;
  // Em um sistema real, armazenaríamos um hash da senha, não a senha em si.
  // passwordHash: string; 
  name?: string;
  role: 'superadmin' | 'admin'; // Exemplo de papéis
}

export interface ClientCompany {
  id: string; // UUID gerado
  name: string; // Nome da empresa cliente
  cnpj?: string; // CNPJ, se aplicável
  contactName?: string; // Nome do contato principal na empresa
  contactEmail: string; // Email do contato principal
  contactPhone?: string;
  status: 'active' | 'inactive' | 'pending_payment' | 'trial';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface License {
  id: string; // UUID gerado
  companyId: string; // ID da ClientCompany associada
  planType: 'basic' | 'standard' | 'premium' | 'custom'; // Tipo de plano
  status: 'active' | 'expired' | 'suspended' | 'pending_activation' | 'cancelled';
  startDate: string; // ISO date string da data de início da licença
  endDate: string;   // ISO date string da data de término da licença
  maxUsers: number;  // Número máximo de usuários permitidos por esta licença
  featuresEnabled?: string[]; // Lista de features específicas habilitadas (opcional)
  notes?: string; // Observações administrativas sobre a licença
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
