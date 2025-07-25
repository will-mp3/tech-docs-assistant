import React, { useState, useEffect } from 'react';
import { SearchBox } from './components/SearchBox';
import { SearchResults } from './components/SearchResults';
import { DocumentUpload } from './components/DocumentUpload';
import { AIAssistant } from './components/AIAssistant';
import { apiService, type SearchResult } from './services/api';
import { DocumentManager } from './components/DocumentManager';
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
        maxWidth: '900px',
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
            AI-powered search and Q&A for technical documentation
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
          alignItems: 'center',
          gap: '2rem'
        }}>
          <DocumentUpload onDocumentAdded={handleDocumentAdded} />
          
          <AIAssistant />
              
          <div style={{ width: '100%', maxWidth: '800px' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '500',
              color: '#111827',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Or search documents directly:
            </h3>
            
            <SearchBox 
              onResults={setSearchResults} 
              onLoading={setLoading} 
            />
            
            <SearchResults 
              results={searchResults} 
              loading={loading} 
            />
          </div>

          <div style={{
            width: '100%',
            height: '1px',
            backgroundColor: '#e5e7eb',
            margin: '1rem 0'
          }}></div>

          <DocumentManager />
        </main>
      </div>
    </div>
  );
}

export default App;