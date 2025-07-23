// Mock Claude service - replace with real Claude API later
export interface ClaudeResponse {
  answer: string;
  reasoning: string;
}

export interface RAGContext {
  query: string;
  documents: Array<{
    title: string;
    content: string;
    source: string;
    score: number;
  }>;
}

export const claudeService = {
  // Mock Claude response - generates realistic AI-style answers
  async generateRAGResponse(context: RAGContext): Promise<ClaudeResponse> {
    const { query, documents } = context;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (documents.length === 0) {
      return {
        answer: "I couldn't find any relevant documents to answer your question. Try uploading some technical documentation or adjusting your search terms.",
        reasoning: "No relevant documents found in the knowledge base."
      };
    }

    // Generate contextual response based on documents
    const topDoc = documents[0];
    const technologies = [...new Set(documents.map(d => d.source))];
    
    let answer = "";
    
    // Determine response based on query patterns
    if (query.toLowerCase().includes('how') || query.toLowerCase().includes('what')) {
      answer = `Based on the documentation I found, here's what I can tell you about ${query}:\n\n`;
      
      // Extract key information from top document
      const sentences = topDoc.content.split('.').slice(0, 3);
      answer += sentences.join('. ') + '.\n\n';
      
      if (documents.length > 1) {
        answer += `I also found related information in ${documents.length - 1} other document(s). `;
      }
      
      answer += `The most relevant information comes from "${topDoc.title}" which covers this topic in detail.`;
      
    } else if (query.toLowerCase().includes('best practices') || query.toLowerCase().includes('recommended')) {
      answer = `Here are the key best practices I found in your documentation:\n\n`;
      
      // Extract list items or numbered points if they exist
      const content = topDoc.content;
      const lines = content.split('\n').filter(line => 
        line.trim().match(/^(\d+\.|•|-|\*)/));
      
      if (lines.length > 0) {
        answer += lines.slice(0, 5).join('\n') + '\n\n';
      } else {
        answer += topDoc.content.substring(0, 200) + '...\n\n';
      }
      
      answer += `This information is sourced from "${topDoc.title}".`;
      
    } else {
      // General query response
      answer = `I found relevant information about "${query}" in your documentation:\n\n`;
      answer += topDoc.content.substring(0, 300) + '...\n\n';
      answer += `This comes from "${topDoc.title}". `;
      
      if (documents.length > 1) {
        answer += `I also found ${documents.length - 1} other relevant document(s) that might help.`;
      }
    }

    return {
      answer,
      reasoning: `Found ${documents.length} relevant document(s). Top match: "${topDoc.title}" with ${Math.round(topDoc.score * 100)}% relevance.`
    };
  },

  // For future: real Claude API integration
  async generateWithRealClaude(context: RAGContext): Promise<ClaudeResponse> {
    // TODO: Implement real Claude API call
    // const response = await fetch('https://api.anthropic.com/v1/messages', {...});
    throw new Error('Real Claude integration not implemented yet');
  }
};