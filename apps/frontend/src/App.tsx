import React, { useState, useEffect } from 'react';
import { SearchBox } from './components/SearchBox';
import { SearchResults } from './components/SearchResults';
import { DocumentUpload } from './components/DocumentUpload';
import { apiService, type SearchResult } from './services/api';
import './App.css';

function App() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  const testConnection = async () => {
    try {
      await apiService.test();
      setApiConnected(true);
    } catch (error) {
      console.error('API connection failed:', error);
      setApiConnected(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleDocumentAdded = () => {
    // Refresh connection status and clear search results
    testConnection();
    setSearchResults([]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Technical Documentation Assistant
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            AI-powered search for technical documentation
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: apiConnected ? '#10b981' : '#ef4444'
            }}></div>
            <span>API {apiConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </header>

        <main style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <DocumentUpload onDocumentAdded={handleDocumentAdded} />
          
          <SearchBox 
            onResults={setSearchResults} 
            onLoading={setLoading} 
          />
          
          <SearchResults 
            results={searchResults} 
            loading={loading} 
          />
        </main>
      </div>
    </div>
  );
}

export default App;