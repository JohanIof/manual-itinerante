# Plano de construção — Starlight + IA

Documentação Astro Starlight com busca inteligente via IA, hospedada na Vercel.

---

## Visão geral

O site é uma documentação estática (Starlight/Astro) com um widget de perguntas e respostas alimentado por IA. A IA responde **somente com base no conteúdo existente no site**, sem inventar informações. O provedor de IA é trocável via variável de ambiente.

---

## Fases

### Fase 1 — Projeto base

**Objetivo:** Ter o Starlight rodando localmente e na Vercel.

Tarefas:
- Criar o projeto com `npm create astro@latest -- --template starlight`
- Configurar `astro.config.mjs` (título, idioma, sidebar)
- Criar as primeiras páginas de documentação em `src/content/docs/`
- Conectar ao repositório Git
- Fazer deploy inicial na Vercel (zero config — Astro é detectado automaticamente)
- Verificar que o build passa sem erros

Entregável: URL pública funcionando com pelo menos 3 páginas de conteúdo.

---

### Fase 2 — Extração de conteúdo no build

**Objetivo:** Gerar um `content.json` estático com todo o conteúdo do site durante o build.

Tarefas:
- Criar um plugin Astro em `src/plugins/content-indexer.ts`
- O plugin percorre todos os arquivos `.md` e `.mdx` em `src/content/docs/`
- Para cada arquivo, extrai: `slug`, `title`, `description` (frontmatter) e `body` (texto limpo, sem markdown)
- Serializa tudo em `public/content.json` durante o hook `astro:build:done`
- Testar localmente: `npm run build` deve gerar `dist/content.json`

Estrutura do `content.json`:
```json
[
  {
    "slug": "introducao",
    "title": "Introdução",
    "description": "Visão geral do projeto",
    "body": "Texto puro da página..."
  }
]
```

Entregável: `content.json` gerado automaticamente a cada build.

---

### Fase 3 — Vercel Function `/api/ask`

**Objetivo:** Criar o endpoint serverless que recebe a pergunta e consulta a IA.

Tarefas:
- Criar `api/ask.ts` (Vercel Functions são detectadas automaticamente na pasta `api/`)
- A função recebe `{ question: string, context: string }` via POST
- Monta o prompt com instrução clara: *"Responda somente com base no conteúdo abaixo. Se a resposta não estiver no conteúdo, diga que não encontrou a informação."*
- Chama a API do provedor configurado via variável de ambiente `AI_PROVIDER`
- Retorna `{ answer: string }`

Estrutura de providers (arquivo `api/_providers.ts`):
```
AI_PROVIDER=claude  → usa @anthropic-ai/sdk
AI_PROVIDER=openai  → usa openai
AI_PROVIDER=gemini  → usa @google/generative-ai
```

Variáveis de ambiente necessárias na Vercel:
```
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-...
# ou
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Entregável: `POST /api/ask` respondendo corretamente em produção.

---

### Fase 4 — Widget de busca no frontend

**Objetivo:** Criar o componente visual de perguntas e respostas integrado ao Starlight.

Tarefas:
- Criar componente `src/components/AskWidget.tsx` (React/Preact)
- O componente carrega `content.json` uma vez via `fetch('/content.json')`
- Interface: campo de texto + botão enviar + área de resposta
- Ao submeter, envia `POST /api/ask` com a pergunta e o conteúdo como contexto
- Exibe estado de carregamento e trata erros
- Integrar ao layout do Starlight via slot customizado em `astro.config.mjs`:
  ```js
  components: {
    Header: './src/components/HeaderWithWidget.astro'
  }
  ```

Estados do widget:
- Idle: campo vazio, botão desabilitado
- Loading: spinner, botão desabilitado
- Success: resposta exibida com fonte e link da página referenciada
- Error: mensagem amigável

Entregável: Widget funcional em todas as páginas da documentação.

---

### Fase 5 — Qualidade e limites

**Objetivo:** Garantir que a IA só responde com base no conteúdo do site.

Tarefas:
- Refinar o prompt do sistema para reforçar o comportamento esperado
- Limitar o contexto enviado: se `content.json` for grande, enviar apenas os trechos mais relevantes (busca por similaridade simples com `String.includes` ou TF-IDF client-side)
- Adicionar rate limiting básico na Vercel Function (ex: 10 req/min por IP)
- Testar perguntas fora do escopo — a IA deve responder "não encontrei essa informação no site"
- Testar troca de provider via variável de ambiente sem alterar código

Entregável: Comportamento previsível e seguro da IA.

---

### Fase 6 — Polimento

**Objetivo:** UX final do widget e deploy estável.

Tarefas:
- Estilizar o widget seguindo o tema do Starlight (CSS custom properties do tema)
- Suporte a modo escuro automático
- Acessibilidade: `aria-live` na área de resposta, navegação por teclado
- Animação sutil de entrada da resposta
- Adicionar botão "Limpar" para nova pergunta
- Revisar performance do build: `content.json` não deve ultrapassar ~500KB
- Documentar as variáveis de ambiente no README

Entregável: Widget pronto para uso em produção.

---

## Estrutura de arquivos final

```
/
├── api/
│   ├── ask.ts              # Vercel Function principal
│   └── _providers.ts       # Abstração dos provedores de IA
├── src/
│   ├── components/
│   │   └── AskWidget.tsx   # Widget React/Preact
│   ├── content/
│   │   └── docs/           # Arquivos .md e .mdx
│   └── plugins/
│       └── content-indexer.ts  # Plugin Astro
├── public/                 # content.json gerado aqui no dev
├── astro.config.mjs
└── vercel.json             # Configuração opcional de rewrite
```

---

## Dependências

| Pacote | Uso |
|---|---|
| `astro` + `@astrojs/starlight` | Framework base |
| `@astrojs/react` ou `@astrojs/preact` | Widget interativo |
| `@anthropic-ai/sdk` | Provider Claude |
| `openai` | Provider OpenAI (opcional) |
| `gray-matter` | Leitura de frontmatter no plugin |
| `remark-strip-markdown` | Texto puro a partir de MDX |

---

## Decisões de arquitetura

**Por que `content.json` em vez de RAG?** Para documentações com até ~200 páginas médias, injetar o conteúdo direto no contexto da IA é mais simples, sem banco de dados, sem embeddings e funciona perfeitamente na Vercel. Se o site crescer muito, a migração para RAG é incremental — só muda a Vercel Function, o widget não precisa ser alterado.

**Por que a abstração de providers na Vercel Function?** O frontend nunca sabe qual IA está sendo usada. Trocar o provider é só mudar variáveis de ambiente no painel da Vercel, sem novo deploy de código.

**Por que não usar a API da IA direto no cliente?** Expor a API key no browser é um risco de segurança. Toda chamada passa pela Vercel Function, que mantém as chaves seguras no servidor.

---

## Ordem de prioridade

1. Fase 1 — base funcionando na Vercel
2. Fase 3 — endpoint de IA testável via `curl`
3. Fase 2 — conteúdo indexado
4. Fase 4 — widget integrado
5. Fase 5 — limites e qualidade
6. Fase 6 — polimento
