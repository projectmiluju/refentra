import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import TagBadge from '../common/TagBadge';

interface AddReferenceModalProps {
  onClose: () => void;
}

const AddReferenceModal: React.FC<AddReferenceModalProps> = ({ onClose }) => {
  const [tags, setTags] = useState<string[]>(['Frontend', 'Design']);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-sys-text">
      <div className="w-full max-w-[560px] bg-surface rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h2 className="text-2xl font-pretendard font-bold mb-6">새 레퍼런스 아카이브</h2>
        
        <form className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">URL 주소</label>
            <Input type="url" placeholder="https://..." required />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">레퍼런스 제목 (Title)</label>
            <Input type="text" placeholder="제목을 입력하세요" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">부연 설명 (Description)</label>
            <textarea 
              rows={4}
              placeholder="레퍼런스에 대한 설명을 남겨주세요."
              className="w-full px-4 py-3 bg-[#060E20] text-sys-text font-pretendard rounded-lg border border-slate-700 focus:border-primary placeholder-text-muted outline-none transition-colors resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">태그 (Tags)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <TagBadge key={tag} label={tag} onRemove={() => removeTag(tag)} />
              ))}
            </div>
            <Input 
              type="text" 
              placeholder="태그 입력 후 Enter" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
            <Button type="submit">저장하기</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReferenceModal;
