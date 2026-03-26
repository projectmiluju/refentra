import type { ReferenceDraft, ReferenceItem, ReferenceResponse } from '../types/reference';

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

export const fetchReferences = async (): Promise<ReferenceItem[]> => {
  const response = await fetch(REFERENCE_API_PATH);

  if (!response.ok) {
    throw new Error(await toErrorMessage(response, '레퍼런스를 불러오지 못했습니다.'));
  }

  const references = (await response.json()) as ReferenceResponse[];
  return references.map(mapReferenceResponse);
};

export const createReference = async (draft: ReferenceDraft): Promise<ReferenceItem> => {
  const response = await fetch(REFERENCE_API_PATH, {
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
