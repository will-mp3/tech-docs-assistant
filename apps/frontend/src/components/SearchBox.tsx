import React, { useState } from 'react';
import { apiService, type SearchResult } from '../services/api';

interface SearchBoxProps {
  onResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onResults, onLoading }) => {
  const [query, setQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    onLoading(true);
    
    try {
      const response = await apiService.search(query);
      onResults(response.results);
    } catch (error) {
      console.error('Search error:', error);
      onResults([]);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', marginBottom: '2rem' }}>
      <form onSubmit={handleSearch}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search technical documentation..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!query.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: query.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: query.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};