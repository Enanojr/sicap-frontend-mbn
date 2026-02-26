import React, { useState, useEffect, useRef } from 'react';
// Asegúrate de importar el CSS nuevo
import '../../styles/styles.css'; 

interface Option {
  value: string | number;
  label: string;
  keywords?: string; 
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value);
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else {
      setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedOption = options.find(opt => opt.value === value);
        setSearchTerm(selectedOption ? selectedOption.label : '');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(option => {
    const term = searchTerm.toLowerCase();
    const labelMatch = option.label.toLowerCase().includes(term);
    const keywordMatch = option.keywords ? option.keywords.toLowerCase().includes(term) : false;
    return labelMatch || keywordMatch;
  });

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  return (
    // CLASES ACTUALIZADAS CON PREFIJO 'cm-'
    <div className="cm-search-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="cm-input-select cm-search-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      <span className="cm-search-arrow">▼</span>

      {isOpen && (
        <ul className="cm-search-options">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className={option.value === value ? 'cm-selected' : ''}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="cm-no-results">No se encontraron resultados</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;