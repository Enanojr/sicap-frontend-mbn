import React, { useState, useEffect, useRef } from 'react';
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
  onSearch?: (term: string) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  onSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Flag: true mientras el usuario está escribiendo activamente (modo búsqueda externa)
  const isTypingRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincroniza el label cuando cambia el value seleccionado,
  // pero NO interrumpe si el usuario está escribiendo en modo onSearch.
  useEffect(() => {
    if (isTypingRef.current && onSearch) return; // no pisamos lo que escribe el usuario
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        isTypingRef.current = false;
        setIsOpen(false);
        const selectedOption = options.find(opt => String(opt.value) === String(value));
        setSearchTerm(selectedOption ? selectedOption.label : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  // Filtrado local solo cuando NO hay búsqueda externa
  const filteredOptions = onSearch
    ? options
    : options.filter(option => {
        const term = searchTerm.toLowerCase();
        return (
          option.label.toLowerCase().includes(term) ||
          (option.keywords ? option.keywords.toLowerCase().includes(term) : false)
        );
      });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    isTypingRef.current = true; // marca que el usuario está escribiendo
    setSearchTerm(term);
    setIsOpen(true);
    onSearch?.(term);
  };

  const handleSelect = (option: Option) => {
    isTypingRef.current = false; // ya no está buscando, seleccionó
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Si tiene onSearch y no hay valor seleccionado, dispara búsqueda vacía
    // para que el padre decida si mostrar algo o no
    if (onSearch && !value) onSearch(searchTerm);
  };

  return (
    <div className="cm-search-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="cm-input-select cm-search-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
      />
      <span className="cm-search-arrow">▼</span>

      {isOpen && (
        <ul className="cm-search-options">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className={String(option.value) === String(value) ? 'cm-selected' : ''}
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