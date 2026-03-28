export interface ReferenceItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  uploader: string;
  date: string;
}

export type DashboardMode = 'portfolio' | 'product';

export interface ReferenceListQuery {
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface ReferenceListResult {
  items: ReferenceItem[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  availableTags: string[];
}

export interface ReferenceDraft {
  url: string;
  title: string;
  description: string;
  tags: string[];
}

export interface ReferenceResponse {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  uploader_id: string;
  created_at: string;
}

export interface ReferenceListResponse {
  items: ReferenceResponse[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  available_tags: string[];
}
