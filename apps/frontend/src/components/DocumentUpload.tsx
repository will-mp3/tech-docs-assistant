import React, { useState } from 'react';
import { apiService } from '../services/api';

interface DocumentUploadProps {
  onDocumentAdded: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentAdded }) => {
  // Form state
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'manual'>('file');
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // URL scraping state
  const [url, setUrl] = useState('');
  
  // Manual entry state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Shared state
  const [source, setSource] = useState('');
  const [technology, setTechnology] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if not set
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('technology', technology.trim() || 'General');
    formData.append('source', source.trim() || `Uploaded file: ${selectedFile.name}`);

    try {
      const response = await fetch('http://localhost:8080/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleUrlScrape = async () => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    try {
      const response = await apiService.scrapeUrl({
        url: url.trim(),
        technology: technology.trim() || 'Web Documentation',
        source: source.trim() || url.trim()
      });
      
      return response;
    } catch (error) {
      console.error('URL scraping error:', error);
      throw error;
    }
  };

  const handleManualEntry = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    try {
      const response = await apiService.addDocument({
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || 'Manual entry',
        technology: technology.trim() || 'General'
      });
      
      return response;
    } catch (error) {
      console.error('Manual entry error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setUploading(true);
    
    try {
      let result;
      
      switch (activeTab) {
        case 'file':
          result = await handleFileUpload();
          break;
        case 'url':
          result = await handleUrlScrape();
          break;
        case 'manual':
          result = await handleManualEntry();
          break;
      }
      
      // Clear form
      resetForm();
      setShowForm(false);
      
      // Notify parent component
      onDocumentAdded();
      
      alert(`Documentation added successfully! ${result?.message || ''}`);
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Failed to add documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUrl('');
    setTitle('');
    setContent('');
    setSource('');
    setTechnology('');
    setActiveTab('file');
  };

  const TabButton: React.FC<{ 
    tab: 'file' | 'url' | 'manual'; 
    icon: string; 
    label: string; 
  }> = ({ tab, icon, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: activeTab === tab ? '#3b82f6' : '#f3f4f6',
        color: activeTab === tab ? 'white' : '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s'
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{ marginBottom: '2rem' }}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>📚</span>
          Add Documentation
        </button>
      ) : (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '1.5rem',
            fontSize: '1.25rem',
            color: '#111827'
          }}>
            Add Documentation
          </h3>
          
          {/* Tab Selection */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <TabButton tab="file" icon="📄" label="Upload File" />
            <TabButton tab="url" icon="🌐" label="Scrape URL" />
            <TabButton tab="manual" icon="✏️" label="Manual Entry" />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Tab Content */}
            {activeTab === 'file' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Select File:
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFileChange}
                  style={{
                    padding: '0.75rem',
                    border: '2px dashed #d1d5db',
                    borderRadius: '0.5rem',
                    width: '100%',
                    backgroundColor: '#f9fafb'
                  }}
                />
                {selectedFile && (
                  <p style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.875rem', 
                    color: '#059669',
                    fontWeight: '500'
                  }}>
                    ✓ Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>
            )}

            {activeTab === 'url' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Website URL:
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.example.com/api-guide"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                />
                <p style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem', 
                  color: '#6b7280' 
                }}>
                  Enter the URL of a documentation page, blog post, or technical article
                </p>
              </div>
            )}

            {activeTab === 'manual' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Title *:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                    required
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Content *:
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste or type document content here..."
                    required
                    rows={8}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      width: '100%',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </>
            )}

            {/* Shared Fields */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Technology:
                </label>
                <input
                  type="text"
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  placeholder="React, TypeScript, Python, etc."
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Source:
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Source reference (optional)"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {uploading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {uploading ? 'Processing...' : 'Add Documentation'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};