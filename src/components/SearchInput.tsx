import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';

type Primitive = string | number | Date;

type PathsToValue<T> = {
  [K in keyof T]: T[K] extends Primitive
    ? K
    : T[K] extends Array<infer U>
    ? U extends Primitive
      ? K
      : PathsToValue<U>
    : T[K] extends object
    ? PathsToValue<T[K]>
    : never;
}[keyof T];

interface SearchInputProps<T> {
  items: T[];
  onResultsChange: (results: T[]) => void;
  searchFields?: PathsToValue<T>[];
  placeholder?: string;
}
//@ts-expect-error: Type 'string' is not assignable to type 'PathsToValue<T>'.
const SearchInput = <T extends Record<string>>({
  items,
  onResultsChange,
  searchFields,
  placeholder = 'Search...'
}: SearchInputProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Reset filtered items when items prop changes
  useEffect(() => {
    onResultsChange(items);
  }, [items, onResultsChange]);

  // Get default search fields if none provided
  const defaultSearchFields = useMemo(() => {
    if (searchFields && searchFields.length > 0) return searchFields;
    
    if (!items || items.length === 0) return [];
    
    const firstItem = items[0];
    
    return Object.entries(firstItem)
      .filter(([_, value]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        return (
          typeof value === 'string' ||
          typeof value === 'number' ||
          value instanceof Date
        );
      })
      .map(([key]) => key as PathsToValue<T>);
  }, [items, searchFields]);

  type Primitive = string | number | boolean | Date | null | undefined;

type NestedObject = {
  [key: string]: NestedValue;
};

type NestedValue = Primitive | NestedObject | NestedValue[];

const getNestedValue = (obj: NestedObject, path: string): Primitive | undefined => {
    const parts = path.split('.');
    let current: NestedValue = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      
      if (Array.isArray(current)) {
        if (current.every(item => 
          typeof item === 'string' || 
          typeof item === 'number' || 
          item instanceof Date
        )) {
          return current.join(' ');
        }
        current = current.map(item => getNestedValue(item as NestedObject, part)).filter(Boolean).join(' ');
      } else {
        current = (current as NestedObject)[part];
      }
    }
    
    return current as Primitive;
};

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim() || !items) {
      return items || [];
    }

    const lowercaseSearch = searchTerm.toLowerCase();

    return items.filter(item => {
      return defaultSearchFields.some(field => {
        const value = getNestedValue(item, field as string);
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseSearch);
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowercaseSearch);
        }
        if (value instanceof Date) {
          return value.toLocaleString().toLowerCase().includes(lowercaseSearch);
        }
        return false;
      });
    });
  }, [items, searchTerm, defaultSearchFields, getNestedValue]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    

    if (!newSearchTerm.trim()) {
      onResultsChange(items);
    } else {
      onResultsChange(filteredItems);
    }
  };

  return (
    <div className="relative w-full max-w-sm mb-4">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        value={searchTerm}
        onChange={handleSearch}
        placeholder={placeholder}
        className="w-full pl-8 pr-4 py-2 rounded-md border border-input bg-background h-9"
      />
      <div className="mt-1 text-sm text-muted-foreground">
        {filteredItems.length} results found
      </div>
    </div>
  );
};

export default SearchInput;