export interface ReferenceItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  uploader: string;
  date: string;
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
