
export interface AdminUser {
  id: string;
  email: string;
  // Em um sistema real, armazenaríamos um hash da senha, não a senha em si.
  // passwordHash: string; 
  name?: string;
  role: 'superadmin' | 'admin'; // Exemplo de papéis
}

export interface EnderecoEmpresa {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento?: string;
}

export type SituacaoICMSEmpresa = 'contribuinte' | 'nao_contribuinte' | 'isento';

export interface ClientCompany {
  id: string;
  type: 'fisica' | 'juridica';
  razaoSocial: string; // Nome completo para PF, Razão Social para PJ
  nomeFantasia: string; // Apelido para PF (opcional), Nome Fantasia para PJ (obrigatório)
  cnpj?: string; // Para PJ
  cpf?: string; // Para PF
  situacaoIcms: SituacaoICMSEmpresa;
  inscricaoEstadual?: string; // Obrigatório se situacaoIcms for 'contribuinte'
  responsavelNome: string; // Nome do responsável/contato principal
  emailFaturamento: string; // Email para faturamento/contato principal
  contactPhone?: string; // Telefone de contato principal
  endereco: EnderecoEmpresa;
  status: 'active' | 'inactive' | 'pending_payment' | 'trial'; // Status da licença/cliente
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
