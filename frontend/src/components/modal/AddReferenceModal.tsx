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

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || tagInput.trim() === '') {
      return;
    }

    event.preventDefault();
    const normalizedTag = tagInput.trim();
    if (!tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/25 p-4 backdrop-blur-sm text-sys-text">
      <div className="w-full max-w-[640px] rounded-2xl border border-border/80 bg-surface shadow-float">
        <div className="border-b border-border/70 px-6 py-5">
          <p className="ui-label">Capture</p>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em]">{REFERENCE_MODAL_TEXT.title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">{REFERENCE_MODAL_TEXT.subtitle}</p>
        </div>

        <form className="flex flex-col gap-5 px-6 py-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={urlInputId} className="ui-label mb-3 block">
                {REFERENCE_MODAL_TEXT.urlLabel}
              </label>
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
              <label htmlFor={titleInputId} className="ui-label mb-3 block">
                {REFERENCE_MODAL_TEXT.titleLabel}
              </label>
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
          </div>

          <div>
            <label htmlFor={descriptionInputId} className="ui-label mb-3 block">
              {REFERENCE_MODAL_TEXT.descriptionLabel}
            </label>
            <textarea
              id={descriptionInputId}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={REFERENCE_MODAL_TEXT.descriptionPlaceholder}
              disabled={isSubmitting}
              className="min-h-[148px] w-full resize-none rounded-md border border-border/70 bg-surface px-4 py-3 text-sys-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-surface-soft disabled:text-text-muted"
            />
            <p className="mt-2 text-sm text-text-muted">{REFERENCE_MODAL_TEXT.helper}</p>
          </div>

          <div>
            <label htmlFor={tagsInputId} className="ui-label mb-3 block">
              {REFERENCE_MODAL_TEXT.tagsLabel}
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagBadge key={tag} label={tag} onRemove={() => removeTag(tag)} />
              ))}
            </div>
            <Input
              id={tagsInputId}
              type="text"
              placeholder={REFERENCE_MODAL_TEXT.tagPlaceholder}
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleAddTag}
              disabled={isSubmitting}
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-border/70 pt-5">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {REFERENCE_MODAL_TEXT.cancel}
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? REFERENCE_MODAL_TEXT.submitting : REFERENCE_MODAL_TEXT.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReferenceModal;
