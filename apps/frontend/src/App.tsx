import React, { useState, useEffect } from 'react';
import { SearchBox } from './components/SearchBox';
import { SearchResults } from './components/SearchResults';
import { apiService, type SearchResult } from './services/api';
import './App.css';  // This line is crucial

function App() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await apiService.test();
        setApiConnected(true);
      } catch (error) {
        console.error('API connection failed:', error);
        setApiConnected(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Technical Documentation Assistant</h1>
          <p>AI-powered search for technical documentation</p>
          <div className="status">
            <div className={`status-dot ${apiConnected ? 'connected' : 'disconnected'}`}></div>
            <span>API {apiConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </header>

        <main className="main">
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