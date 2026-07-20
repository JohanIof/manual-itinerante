export interface AIProvider {
  ask(question: string, context: string): Promise<string>;
}

const SYSTEM_PROMPT = `Você é o assistente inteligente do Manual Itinerante — a central de documentação de processos da empresa. Seu papel é ajudar os colaboradores a encontrar informações rapidamente, resumindo o conteúdo e direcionando para as páginas corretas.

## Regras obrigatórias:
1. Responda SOMENTE com base no conteúdo fornecido abaixo. NUNCA invente informações.
2. Se a resposta não estiver no conteúdo, diga: "Não encontrei essa informação na documentação disponível. Tente reformular sua pergunta ou navegue pelas seções do manual."
3. Responda sempre em português brasileiro.
4. Seja conciso, direto e didático — resuma o conteúdo para acelerar o aprendizado.

## Como referenciar páginas e criar Highlights:
- Cada seção do conteúdo começa com [PÁGINA: título | URL: /caminho/da/pagina]
- SEMPRE inclua links para as páginas relevantes usando markdown.
- NOVIDADE: Para ajudar o usuário a encontrar a informação exata, adicione o parâmetro "?highlight=termo" no link. O termo deve ser uma ou duas palavras exatas que existem no trecho que responde à pergunta.
- Exemplo de link com highlight: [Veja sobre Windows](/software/compatibilidade?highlight=Windows)
- Ao final da resposta, adicione uma seção "📄 Páginas relacionadas:" com os links (com highlight) para todas as páginas que foram usadas.

## Formato da resposta:
- Use **negrito** para termos importantes
- Use listas quando apropriado
- Seja um guia: mostre ONDE encontrar mais detalhes e facilite o clique
- Mantenha respostas curtas (máximo 3-4 parágrafos)`;

function createGeminiProvider(): AIProvider {
  return {
    async ask(question: string, context: string): Promise<string> {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `${SYSTEM_PROMPT}\n\n---\nCONTEÚDO DA DOCUMENTAÇÃO:\n${context}\n---\n\nPergunta do usuário: ${question}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.2,
        },
      });
      
      return result.response.text();
    }
  };
}

function createOpenAIProvider(): AIProvider {
  return {
    async ask(question: string, context: string): Promise<string> {
      const OpenAI = (await import('openai')).default;
      const apiKey = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');
      
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `CONTEÚDO DA DOCUMENTAÇÃO:\n${context}\n\n---\nPergunta: ${question}` },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });
      
      return response.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
    }
  };
}

function createGroqProvider(): AIProvider {
  return {
    async ask(question: string, context: string): Promise<string> {
      const OpenAI = (await import('openai')).default;
      const apiKey = import.meta.env.GROQ_API_KEY || process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY não configurada');
      
      const openai = new OpenAI({ 
        apiKey,
        baseURL: "https://api.groq.com/openai/v1"
      });
      const response = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `CONTEÚDO DA DOCUMENTAÇÃO:\n${context}\n\n---\nPergunta: ${question}` },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });
      
      return response.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
    }
  };
}

function createClaudeProvider(): AIProvider {
  return {
    async ask(question: string, context: string): Promise<string> {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const apiKey = import.meta.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');
      
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `CONTEÚDO DA DOCUMENTAÇÃO:\n${context}\n\n---\nPergunta: ${question}` },
        ],
      });
      
      const textBlock = response.content.find((b: any) => b.type === 'text');
      return textBlock ? (textBlock as any).text : 'Não foi possível gerar uma resposta.';
    }
  };
}

export function getProvider(): AIProvider {
  const provider = (import.meta.env.AI_PROVIDER || process.env.AI_PROVIDER || 'gemini').toLowerCase();
  
  switch (provider) {
    case 'gemini': return createGeminiProvider();
    case 'openai': return createOpenAIProvider();
    case 'groq': return createGroqProvider();
    case 'claude':
    case 'anthropic': return createClaudeProvider();
    default:
      throw new Error(`Provider de IA desconhecido: ${provider}. Use: gemini, openai, groq ou claude`);
  }
}
