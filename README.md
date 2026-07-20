# Manual Itinerante

Documentação de processos da Itinerante com busca inteligente por IA.

Construído com [Astro Starlight](https://starlight.astro.build/) e integração com IA (Gemini, OpenAI ou Claude).

## Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com sua chave de API

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `AI_PROVIDER` | Provider de IA: `gemini`, `openai` ou `claude` | Sim (padrão: `gemini`) |
| `GEMINI_API_KEY` | Chave da API do Google Gemini | Sim (se provider = gemini) |
| `OPENAI_API_KEY` | Chave da API da OpenAI | Sim (se provider = openai) |
| `ANTHROPIC_API_KEY` | Chave da API do Anthropic Claude | Sim (se provider = claude) |

## Estrutura

```
src/
├── components/
│   ├── AskWidget.tsx          # Widget de perguntas com IA
│   └── HeaderWithWidget.astro # Header customizado
├── content/docs/pt-br/        # Páginas de documentação
├── integrations/
│   └── content-indexer.ts     # Indexador de conteúdo
├── lib/
│   └── ai-providers.ts        # Abstração de providers de IA
├── pages/api/
│   └── ask.ts                 # Endpoint serverless
└── styles/
    └── custom.css             # Estilos customizados
```

## Adicionando Conteúdo

Crie arquivos `.md` nas pastas em `src/content/docs/pt-br/`:
- `juridico/` — Documentação jurídica
- `software/` — Compatibilidade e guias de software
- `processos/` — Processos operacionais

## Deploy na Vercel

1. Conecte o repositório Git à Vercel
2. O Astro é detectado automaticamente
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push
