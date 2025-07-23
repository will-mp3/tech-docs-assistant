import React, { useState } from 'react';
import { apiService, type RAGResponse } from '../services/api';

export const AIAssistant: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const aiResponse = await apiService.askQuestion(question.trim());
      setResponse(aiResponse);
    } catch (err) {
      console.error('AI Assistant error:', err);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleQuestion = (exampleQ: string) => {
    setQuestion(exampleQ);
  };

  const exampleQuestions = [
    "How do React hooks work?",
    "What are TypeScript best practices?",
    "What are the main concepts I should know?",
    "How do I get started with this technology?"
  ];

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '800px', 
      marginBottom: '2rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      backgroundColor: 'white',
      padding: '1.5rem'
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '1.5rem'
          }}>🤖</span>
          AI Assistant
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          margin: 0
        }}>
          Ask questions about your uploaded documents. The AI will search your knowledge base and provide answers with sources.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your documents..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <button
            type="submit"
            disabled={!question.trim() || loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: (!question.trim() || loading) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: (!question.trim() || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
            {loading ? 'Thinking...' : 'Ask AI'}
          </button>

          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Powered by RAG + AI
          </div>
        </div>
      </form>

      {/* Example Questions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Try these example questions:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {exampleQuestions.map((q, index) => (
            <button
              key={index}
              onClick={() => handleExampleQuestion(q)}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* AI Response */}
      {response && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '500',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Answer:
            </h3>
            <div style={{
              color: '#374151',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {response.answer}
            </div>
          </div>

          {/* Sources */}
          {response.sources.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '0.75rem'
              }}>
                Sources ({response.totalSources}):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {response.sources.map((source, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>
                        {source.title}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {source.source}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#059669',
                      backgroundColor: '#d1fae5',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      {source.relevance}% match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            {response.reasoning}
          </div>
        </div>
      )}
    </div>
  );
};