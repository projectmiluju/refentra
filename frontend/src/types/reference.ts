export interface ReferenceItem {
  id: number;
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
