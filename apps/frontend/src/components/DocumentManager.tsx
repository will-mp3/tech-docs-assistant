import React, { useState, useEffect } from 'react';
import { apiService, type Document } from '../services/api';

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDocuments();
      setDocuments(response.documents);
      setError(null);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (document: Document) => {
    // If it's a web URL, open in new tab
    if (document.source.startsWith('http')) {
      window.open(document.source, '_blank');
    } else {
      // For text-based files, show preview
      setSelectedDocument(document);
      setShowPreview(true);
    }
  };

  const handleDeleteDocument = async (document: Document, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering document click
    
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${document.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      setDeletingId(document.id);
      await apiService.deleteDocument(document.id);
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      console.log(`Document deleted: ${document.title}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileTypeIcon = (document: Document): string => {
    const source = document.source.toLowerCase();
    if (source.includes('http')) return '🌐';
    if (source.includes('.pdf')) return '📄';
    if (source.includes('.doc')) return '📝';
    if (source.includes('manual')) return '✏️';
    return '📄';
  };

  const formatDate = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Determine which documents to show
  const documentsToShow = showAll ? documents : documents.slice(0, 5);
  const hasMoreDocuments = documents.length > 5;

  if (loading) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        padding: '1rem',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'inline-block',
          width: '1.5rem',
          height: '1.5rem',
          border: '2px solid #f3f4f6',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Loading documents...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        padding: '1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#dc2626'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button
            onClick={loadDocuments}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '2px dashed #d1d5db'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
          No documents in your library yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1000px' }}>
      {/* Compact Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '500',
          color: '#111827',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📚 Document Library
          <span style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: 'normal',
            backgroundColor: '#f3f4f6',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem'
          }}>
            {documents.length} total
          </span>
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {hasMoreDocuments && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: showAll ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              {showAll ? `Show Recent (5)` : `Show All (${documents.length})`}
            </button>
          )}
          <button
            onClick={loadDocuments}
            style={{
              padding: '0.5rem',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Compact Document List */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        {documentsToShow.map((document, index) => (
          <div
            key={document.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: index < documentsToShow.length - 1 ? '1px solid #f3f4f6' : 'none',
              transition: 'background-color 0.2s',
              opacity: deletingId === document.id ? 0.5 : 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            {/* File Icon */}
            <div style={{ 
              fontSize: '1.25rem', 
              marginRight: '0.75rem',
              minWidth: '1.25rem'
            }}>
              {getFileTypeIcon(document)}
            </div>

            {/* Document Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#111827',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '0.25rem'
              }}>
                {document.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {document.source}
              </div>
            </div>

            {/* Technology Tag */}
            <div style={{ marginRight: '0.75rem' }}>
              <span style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.625rem',
                fontWeight: '500'
              }}>
                {document.technology}
              </span>
            </div>

            {/* Date */}
            <div style={{
              fontSize: '0.625rem',
              color: '#9ca3af',
              marginRight: '0.75rem',
              minWidth: '60px',
              textAlign: 'right'
            }}>
              {formatDate(document.timestamp)}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* View/Open Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentClick(document);
                }}
                disabled={deletingId === document.id}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: deletingId === document.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.625rem',
                  fontWeight: '500',
                  minWidth: '60px'
                }}
                title={document.source.startsWith('http') ? 'Open website' : 'View content'}
              >
                {document.source.startsWith('http') ? '🔗 Open' : '👁️ View'}
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteDocument(document, e)}
                disabled={deletingId === document.id}
                style={{
                  padding: '0.375rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: deletingId === document.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.625rem',
                  minWidth: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Delete document"
              >
                {deletingId === document.id ? (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '1px solid #ffffff',
                    borderTop: '1px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  '🗑️'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Indicator */}
      {hasMoreDocuments && !showAll && (
        <div style={{
          textAlign: 'center',
          padding: '0.75rem',
          fontSize: '0.75rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '0 0 0.5rem 0.5rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          Showing 5 of {documents.length} documents
        </div>
      )}

      {/* Content Preview Modal - Same as before */}
      {showPreview && selectedDocument && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {selectedDocument.title}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '1.5rem',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#374151',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {selectedDocument.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};