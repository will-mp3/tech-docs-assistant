import Anthropic from '@anthropic-ai/sdk';

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
  // Real Claude API integration
  async generateRAGResponse(context: RAGContext): Promise<ClaudeResponse> {
    const { query, documents } = context;
    
    // DEBUG: Check if API key is loaded
    console.log('API Key status:', process.env.ANTHROPIC_API_KEY ? 'LOADED' : 'MISSING');
    console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No Claude API key found, using mock response');
      return this.generateMockResponse(context);
    }

    if (documents.length === 0) {
      return {
        answer: "I couldn't find any relevant documents in your knowledge base to answer this question. Try uploading some technical documentation or adjusting your search terms.",
        reasoning: "No relevant documents found in the knowledge base."
      };
    }

    try {
      // Initialize Anthropic client HERE, after env vars are loaded
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      // Prepare context from retrieved documents
      const contextText = documents.map((doc, index) => 
        `Document ${index + 1}: "${doc.title}" (Relevance: ${Math.round(doc.score * 100)}%)
Source: ${doc.source}
Content: ${doc.content}

---`
      ).join('\n');

      // Create system prompt for RAG
      const systemPrompt = `You are a helpful AI assistant that answers questions based on provided documentation. 

INSTRUCTIONS:
- Answer the user's question using ONLY the information provided in the documents below
- If the documents don't contain enough information to answer the question, say so clearly
- Cite specific documents when making claims (e.g., "According to the React documentation...")
- Be concise but comprehensive
- If you're uncertain about something, acknowledge the uncertainty
- Don't make up information that isn't in the provided documents

PROVIDED DOCUMENTS:
${contextText}`;

      const userPrompt = `Based on the documents provided, please answer this question: ${query}`;

      console.log('Calling Claude API...');

      // Call Claude API
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const answer = response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response';
      
      const reasoning = `Generated response using Claude ${process.env.CLAUDE_MODEL}. Found ${documents.length} relevant document(s). Top match: "${documents[0].title}" with ${Math.round(documents[0].score * 100)}% relevance.`;

      console.log(`Generated Claude response for: "${query}"`);
      console.log(`Used ${documents.length} documents, ${response.usage?.input_tokens} input tokens, ${response.usage?.output_tokens} output tokens`);

      return {
        answer,
        reasoning
      };

    } catch (error) {
      console.error('Claude API error:', error);
      
      // Fallback to mock response if API fails
      console.log('Falling back to mock response');
      return this.generateMockResponse(context);
    }
  },

  // Mock response as fallback
  async generateMockResponse(context: RAGContext): Promise<ClaudeResponse> {
    const { query, documents } = context;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (documents.length === 0) {
      return {
        answer: "I couldn't find any relevant documents to answer your question. Try uploading some technical documentation or adjusting your search terms.",
        reasoning: "No relevant documents found in the knowledge base."
      };
    }

    const topDoc = documents[0];
    let answer = "";
    
    if (query.toLowerCase().includes('how') || query.toLowerCase().includes('what')) {
      answer = `Based on the documentation I found, here's what I can tell you about ${query}:\n\n`;
      const sentences = topDoc.content.split('.').slice(0, 3);
      answer += sentences.join('. ') + '.\n\n';
      if (documents.length > 1) {
        answer += `I also found related information in ${documents.length - 1} other document(s). `;
      }
      answer += `The most relevant information comes from "${topDoc.title}".`;
    } else {
      answer = `I found relevant information about "${query}" in your documentation:\n\n`;
      answer += topDoc.content.substring(0, 300) + '...\n\n';
      answer += `This comes from "${topDoc.title}". `;
      if (documents.length > 1) {
        answer += `I also found ${documents.length - 1} other relevant document(s) that might help.`;
      }
    }

    return {
      answer: answer + "\n\n(Note: This is a mock response - add your Claude API key to enable real AI responses)",
      reasoning: `Mock response generated. Found ${documents.length} relevant document(s). Add ANTHROPIC_API_KEY to environment for real Claude responses.`
    };
  }
};