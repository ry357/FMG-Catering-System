import { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({ name, value, onChange, className, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 3 || !isOpen) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`);
        const data = await response.json();
        
        const mapped = data.features.map(f => {
           const p = f.properties;
           const parts = [p.name, p.street, p.city || p.town || p.village, p.state, p.country].filter(Boolean);
           return [...new Set(parts)].join(', ');
        });
        setSuggestions(mapped.filter((v, i, a) => a.indexOf(v) === i));
      } catch (error) {
        console.error('Failed to fetch address suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, isOpen]);

  const handleSelect = (suggestion) => {
    onChange({ target: { name, value: suggestion } });
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setIsOpen(true);
    onChange(e);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && (suggestions.length > 0 || loading) && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-elevated focus:outline-none">
          {loading ? (
            <li className="px-4 py-2 text-sm text-gray-500">Searching places...</li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelect(suggestion)}
                className="cursor-pointer px-4 py-2.5 text-sm text-charcoal hover:bg-gold-50 transition-colors"
              >
                {suggestion}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
