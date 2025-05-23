export interface BrokerCredential {
  id: string;
  user_id: string;
  broker_name: string;
  credentials: {
    'API Key'?: string;
    'Secret Key'?: string;
    'Access Token'?: string;
    'User ID'?: string;
    last_error?: string;
    last_error_details?: string;
    last_error_time?: string;
    [key: string]: any;
  };
  is_active: boolean;
  is_pending_auth: boolean;
  auth_state: string | null;
  created_at: string;
  updated_at: string;
  redirect_url?: string;
  access_token: string | null;
  token_expiry: string | null;
}

export interface SupabaseDatabase {
  broker_credentials: BrokerCredential;
  // Add other tables as needed
} 