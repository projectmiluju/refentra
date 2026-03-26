import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import TagBadge from '../common/TagBadge';
import { REFERENCE_MODAL_TEXT } from '../../constants/uiText';
import type { ReferenceDraft } from '../../types/reference';

interface AddReferenceModalProps {
  onClose: () => void;
  onSave: (draft: ReferenceDraft) => Promise<void>;
}

const AddReferenceModal: React.FC<AddReferenceModalProps> = ({ onClose, onSave }) => {
  const [tags, setTags] = useState<string[]>(['Frontend', 'Design']);
  const [tagInput, setTagInput] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urlInputId = 'reference-url';
  const titleInputId = 'reference-title';
  const descriptionInputId = 'reference-description';
  const tagsInputId = 'reference-tags';

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const normalizedTag = tagInput.trim();
      if (!tags.includes(normalizedTag)) {
        setTags([...tags, normalizedTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (trimmedUrl.length === 0) {
      setErrorMessage(REFERENCE_MODAL_TEXT.emptyUrl);
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setErrorMessage(REFERENCE_MODAL_TEXT.invalidUrl);
      return;
    }

    if (trimmedTitle.length === 0) {
      setErrorMessage(REFERENCE_MODAL_TEXT.emptyTitle);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        url: trimmedUrl,
        title: trimmedTitle,
        description: description.trim(),
        tags,
      });
      setErrorMessage('');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(REFERENCE_MODAL_TEXT.saveErrorFallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-sys-text">
      <div className="w-full max-w-[560px] bg-surface rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h2 className="text-2xl font-pretendard font-bold mb-6">{REFERENCE_MODAL_TEXT.title}</h2>
        
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor={urlInputId} className="block text-sm font-medium text-text-muted mb-2">{REFERENCE_MODAL_TEXT.urlLabel}</label>
            <Input
              id={urlInputId}
              type="url"
              placeholder={REFERENCE_MODAL_TEXT.urlPlaceholder}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              isError={errorMessage === REFERENCE_MODAL_TEXT.emptyUrl || errorMessage === REFERENCE_MODAL_TEXT.invalidUrl}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor={titleInputId} className="block text-sm font-medium text-text-muted mb-2">{REFERENCE_MODAL_TEXT.titleLabel}</label>
            <Input
              id={titleInputId}
              type="text"
              placeholder={REFERENCE_MODAL_TEXT.titlePlaceholder}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              isError={errorMessage === REFERENCE_MODAL_TEXT.emptyTitle}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor={descriptionInputId} className="block text-sm font-medium text-text-muted mb-2">{REFERENCE_MODAL_TEXT.descriptionLabel}</label>
            <textarea 
              id={descriptionInputId}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={REFERENCE_MODAL_TEXT.descriptionPlaceholder}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-[#060E20] text-sys-text font-pretendard rounded-lg border border-slate-700 focus:border-primary placeholder-text-muted outline-none transition-colors resize-none"
            ></textarea>
          </div>

          <div>
            <label htmlFor={tagsInputId} className="block text-sm font-medium text-text-muted mb-2">{REFERENCE_MODAL_TEXT.tagsLabel}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <TagBadge key={tag} label={tag} onRemove={() => removeTag(tag)} />
              ))}
            </div>
            <Input 
              id={tagsInputId}
              type="text" 
              placeholder={REFERENCE_MODAL_TEXT.tagPlaceholder}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={isSubmitting}
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-error text-body-ko" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>{REFERENCE_MODAL_TEXT.cancel}</Button>
            <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? REFERENCE_MODAL_TEXT.submitting : REFERENCE_MODAL_TEXT.submit}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReferenceModal;
