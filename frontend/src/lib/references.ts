import type {
  ReferenceDraft,
  ReferenceItem,
  ReferenceListQuery,
  ReferenceListResponse,
  ReferenceListResult,
  ReferenceResponse,
} from '../types/reference';
import { fetchWithAuth } from './auth';

const REFERENCE_API_PATH = '/api/v1/references';

interface ErrorResponse {
  error?: string;
}

const toErrorMessage = async (response: Response, fallbackMessage: string): Promise<string> => {
  try {
    const body = (await response.json()) as ErrorResponse;
    if (body.error && body.error.trim().length > 0) {
      return body.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
};

export const mapReferenceResponse = (reference: ReferenceResponse): ReferenceItem => ({
  id: reference.id,
  title: reference.title,
  url: reference.url,
  description: reference.description,
  tags: reference.tags,
  uploader: reference.uploader_id,
  date: reference.created_at.slice(0, 10),
});

const buildReferenceListQuery = (query: ReferenceListQuery): string => {
  const params = new URLSearchParams();

  if (query.search && query.search.trim().length > 0) {
    params.set('search', query.search.trim());
  }

  if (query.tags && query.tags.length > 0) {
    params.set('tags', query.tags.join(','));
  }

  if (query.page && query.page > 0) {
    params.set('page', String(query.page));
  }

  if (query.limit && query.limit > 0) {
    params.set('limit', String(query.limit));
  }

  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
};

export const fetchReferences = async (query: ReferenceListQuery = {}): Promise<ReferenceListResult> => {
  const response = await fetchWithAuth(`${REFERENCE_API_PATH}${buildReferenceListQuery(query)}`);

  if (!response.ok) {
    throw new Error(await toErrorMessage(response, '레퍼런스를 불러오지 못했습니다.'));
  }

  const payload = (await response.json()) as ReferenceListResponse;

  return {
    items: payload.items.map(mapReferenceResponse),
    page: payload.page,
    limit: payload.limit,
    totalCount: payload.total_count,
    totalPages: payload.total_pages,
    availableTags: payload.available_tags,
  };
};

export const createReference = async (draft: ReferenceDraft): Promise<ReferenceItem> => {
  const response = await fetchWithAuth(REFERENCE_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(await toErrorMessage(response, '저장에 실패했습니다. 다시 시도해 주세요.'));
    }

    throw new Error(await toErrorMessage(response, '입력값을 다시 확인해 주세요.'));
  }

  const reference = (await response.json()) as ReferenceResponse;
  return mapReferenceResponse(reference);
};
