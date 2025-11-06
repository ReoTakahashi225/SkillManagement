import { useState, useRef, useEffect } from 'react';

interface Option {
  id: number;
  name: string;
  category?: string | null;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
  label?: string;
  groupByCategory?: boolean;
}

export default function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = '選択してください',
  label,
  groupByCategory = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const getSelectedNames = () => {
    return options
      .filter((option) => selectedIds.includes(option.id))
      .map((option) => option.name)
      .join(', ');
  };

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group options by category if enabled
  const groupedOptions = groupByCategory
    ? filteredOptions.reduce((groups, option) => {
        const category = option.category || 'その他';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(option);
        return groups;
      }, {} as Record<string, Option[]>)
    : { all: filteredOptions };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {/* Selected tags */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {options
            .filter((option) => selectedIds.includes(option.id))
            .map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
              >
                {option.name}
                <button
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center justify-between">
          <span className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {selectedIds.length === 0
              ? placeholder
              : `${selectedIds.length}件選択中`}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="検索..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="p-2">
            {Object.keys(groupedOptions).length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">該当なし</div>
            ) : (
              Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category}>
                  {groupByCategory && Object.keys(groupedOptions).length > 1 && category !== 'all' && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                      {category}
                    </div>
                  )}
                  {categoryOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(option.id)}
                        onChange={() => toggleOption(option.id)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">{option.name}</span>
                    </label>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
