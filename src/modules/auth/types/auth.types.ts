import type { DocumentType, UserRole } from "@/types/database.types";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_host_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPrivateDetails {
  user_id: string;
  document_type: DocumentType;
  document_number: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}
