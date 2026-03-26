import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AddReferenceModal from './AddReferenceModal';

describe('AddReferenceModal', () => {
  it('태그 입력 후 Enter를 누르면 중복 없이 태그를 추가해야 한다', async () => {
    const user = userEvent.setup();

    render(<AddReferenceModal onClose={vi.fn()} onSave={vi.fn()} />);

    const tagInput = screen.getByLabelText('태그 (Tags)');
    await user.type(tagInput, 'Infra{enter}');
    await user.type(tagInput, 'Infra{enter}');

    expect(screen.getAllByText('Infra')).toHaveLength(1);
  });

  it('필수값이 유효하면 저장 콜백에 정제된 값을 전달해야 한다', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(<AddReferenceModal onClose={vi.fn()} onSave={handleSave} />);

    await user.type(screen.getByLabelText('URL 주소'), ' https://example.com/article ');
    await user.type(screen.getByLabelText('레퍼런스 제목 (Title)'), '  테스트 문서  ');
    await user.type(screen.getByLabelText('부연 설명 (Description)'), '설명입니다.');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(handleSave).toHaveBeenCalledWith({
      url: 'https://example.com/article',
      title: '테스트 문서',
      description: '설명입니다.',
      tags: ['Frontend', 'Design'],
    });
  });
});
