import React from 'react';
import { type SearchResult } from '../services/api';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, loading }) => {
  if (loading) {
    return (
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            display: 'inline-block',
            width: '2rem',
            height: '2rem',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Searching...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h2 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        marginBottom: '1rem',
        color: '#111827'
      }}>
        Search Results ({results.length})
      </h2>
      <div>
        {results.map((result) => (
          <div key={result.id} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: 'white'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '0.5rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '500', 
                margin: 0,
                color: '#111827'
              }}>
                {result.title}
              </h3>
              <span style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem'
              }}>
                Score: {Math.round(result.score * 100)}%
              </span>
            </div>
            <p style={{ 
              color: '#374151', 
              marginBottom: '0.5rem',
              lineHeight: '1.5'
            }}>
              {result.content}
            </p>
            {result.source.startsWith('http') ? (
              <a 
                href={result.source} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
              >
                {result.source}
              </a>
            ) : (
              <span style={{
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                {result.source}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};