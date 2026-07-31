type SearchInputProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function SearchInput({
  value,
  placeholder = 'Pesquisar...',
  onChange,
}: SearchInputProps) {
  return (
    <label className="search-input">
      <span className="search-input__label">Pesquisar</span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
