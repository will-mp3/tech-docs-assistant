import React, { useState } from 'react';
import { apiService } from '../services/api';

interface DocumentUploadProps {
  onDocumentAdded: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentAdded }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [technology, setTechnology] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Set title from filename if not already set
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    }

    // Use FileReader to read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setUploading(true);
    
    try {
      await apiService.addDocument({
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || 'Manual upload',
        technology: technology.trim() || 'General'
      });
      
      // Clear form
      setTitle('');
      setContent('');
      setSource('');
      setTechnology('');
      setShowForm(false);
      
      // Notify parent component
      onDocumentAdded();
      
      alert('Document added successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to add document');
    } finally {
      setUploading(false);
    }
  };

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
            fontSize: '1rem'
          }}
        >
          Add Document
        </button>
      ) : (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          backgroundColor: 'white'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Add New Document</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Upload File (optional):
              </label>
              <input
                type="file"
                accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json"
                onChange={handleFileUpload}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  width: '100%'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                  borderRadius: '0.25rem',
                  width: '100%',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                  borderRadius: '0.25rem',
                  width: '100%',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                    borderRadius: '0.25rem',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Source:
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="URL or source reference"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {uploading ? 'Adding...' : 'Add Document'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
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