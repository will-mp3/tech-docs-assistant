import React from 'react';
import { type SearchResult } from '../services/api';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  showRelevanceScore?: boolean;
}

interface ResultCardProps {
  result: SearchResult;
  showRelevanceScore?: boolean;
}

// Reusable Result Card Component
const ResultCard: React.FC<ResultCardProps> = ({ result, showRelevanceScore = false }) => {
  const getFileTypeIcon = (source: string): string => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.startsWith('http')) return '🌐';
    if (sourceLower.includes('.pdf')) return '📄';
    if (sourceLower.includes('.doc')) return '📝';
    if (sourceLower.includes('manual')) return '✏️';
    return '📄';
  };

  const handleSourceClick = () => {
    if (result.source.startsWith('http')) {
      window.open(result.source, '_blank');
    } else {
      // For non-URLs, we could show a preview modal here
      // For now, just log that it's not a web URL
      console.log('Non-web source clicked:', result.source);
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem',
      backgroundColor: 'white',
      transition: 'box-shadow 0.2s'
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getFileTypeIcon(result.source)}
          </span>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '500', 
            margin: 0,
            color: '#111827'
          }}>
            {result.title}
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Technology Tag */}
          <span style={{
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {result.technology}
          </span>
          
          {/* Relevance Score */}
          {showRelevanceScore && (
            <span style={{
              fontSize: '0.875rem',
              color: '#059669',
              backgroundColor: '#d1fae5',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '500'
            }}>
              {Math.round(result.score * 100)}% match
            </span>
          )}
          
          {/* Regular Score */}
          {!showRelevanceScore && (
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem'
            }}>
              Score: {Math.round(result.score * 100)}%
            </span>
          )}
        </div>
      </div>
      
      <p style={{ 
        color: '#374151', 
        marginBottom: '0.75rem',
        lineHeight: '1.5',
        fontSize: '0.875rem'
      }}>
        {result.content}
      </p>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {result.source.startsWith('http') ? (
            <a 
              href={result.source} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block'
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
            >
              {result.source}
            </a>
          ) : (
            <span style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}>
              {result.source}
            </span>
          )}
        </div>
        
        <button
          onClick={handleSourceClick}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500',
            marginLeft: '1rem'
          }}
          title={result.source.startsWith('http') ? 'Open website' : 'View content'}
        >
          {result.source.startsWith('http') ? '🔗 Open' : '👁️ View'}
        </button>
      </div>
    </div>
  );
};

export const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, showRelevanceScore = false }) => {
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
          <ResultCard 
            key={result.id} 
            result={result} 
            showRelevanceScore={showRelevanceScore}
          />
        ))}
      </div>
    </div>
  );
};

// Export ResultCard for use in other components
export { ResultCard };