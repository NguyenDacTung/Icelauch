import React, { useState } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';

interface TagSelectorProps {
  label?: string;
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  onAddNewTag?: (newTag: string) => void;
  placeholder?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  label = 'Thể loại / Tags',
  selectedTags = [],
  availableTags = [],
  onChange,
  onAddNewTag,
  placeholder = 'Nhập tên thể loại mới và nhấn Enter...',
}) => {
  const [inputVal, setInputVal] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (!selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
    }

    if (onAddNewTag && !availableTags.includes(trimmed)) {
      onAddNewTag(trimmed);
    }

    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2 text-xs">
      {label && (
        <label className="font-semibold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-ice-accent" />
            <span>{label}</span>
          </span>
          <span className="text-[11px] text-ice-subtext font-normal">
            (Đã chọn {selectedTags.length})
          </span>
        </label>
      )}

      {/* Selected tags container + input */}
      <div className="min-h-[42px] p-2 rounded-lg bg-ice-bg border border-ice-border focus-within:border-ice-accent flex flex-wrap items-center gap-1.5 transition-colors">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-ice-accent/20 text-ice-accent border border-ice-accent/40 shadow-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              className="hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input to type new tag */}
        <div className="flex-1 min-w-[160px] flex items-center gap-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : '+ Thêm thể loại khác...'}
            className="w-full bg-transparent text-white placeholder-ice-subtext text-xs focus:outline-none py-1 px-1"
          />
          {inputVal.trim() && (
            <button
              type="button"
              onClick={() => handleAdd()}
              className="p-1 rounded bg-ice-accent text-white hover:bg-ice-accentHover transition-colors flex-shrink-0"
              title="Thêm thể loại này"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Available tag suggestions pills */}
      {availableTags.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-ice-subtext uppercase font-semibold tracking-wider">
            Gợi ý thể loại sẵn có:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    isSelected
                      ? 'bg-ice-accent text-white border border-ice-accent shadow-sm'
                      : 'bg-ice-card hover:bg-ice-hover text-ice-subtext hover:text-white border border-ice-border'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-60" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

