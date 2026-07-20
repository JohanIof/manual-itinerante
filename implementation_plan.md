# Alternativa Gratuita e com Highlighting (Realce)

Como o problema com a API do Gemini é a exigência de faturamento, podemos mudar a estratégia para garantir que você tenha um assistente inteligente 100% gratuito e com uma experiência ainda mais interativa (realçando as informações na página).

## 1. O Problema da API (Como resolver sem cartão)

Para manter o projeto sem custos e sem precisar de cartão de crédito, recomendo usarmos a **API do Groq** ou o **OpenRouter**. 
- O **Groq** fornece acesso ao modelo `Llama 3` (da Meta) de forma incrivelmente rápida e **totalmente gratuita**, sem pedir dados de pagamento.
- Basta criar uma conta com o Google e gerar a chave. O nosso código já está preparado para abstrair o provedor de IA, então adicionar o Groq é muito simples.

## 2. A Nova Experiência de UX (Chat + Highlight)

Você sugeriu uma ideia fantástica: em vez de apenas dar a resposta, o Chat direciona o usuário para a página e **destaca visualmente** a informação.

### Como vai funcionar:
1. **O Chat (AskWidget):** Quando a IA sugerir uma página, em vez de um link comum, ela criará um link com um parâmetro especial. Exemplo: `[Veja sobre Windows](/software/compatibilidade?highlight=Windows+11)`
2. **O Script de Highlight:** Vamos injetar um script global em todas as páginas do Starlight. Sempre que uma página carregar, ele verifica se existe o parâmetro `?highlight=` na URL.
3. **O Efeito Visual:** O script vai buscar essa palavra/frase exata no texto da página, fazer o scroll automático até ela, e aplicar um efeito de "piscar" ou um fundo amarelo temporário (fading out) usando CSS.

## Proposed Changes

### Componente de IA
Vamos adicionar o provedor do Groq para não dependermos do Google/OpenAI.
#### [MODIFY] `src/lib/ai-providers.ts`
- Adicionar a função `createGroqProvider()` que se conecta à API gratuita do Groq.
- Atualizar o prompt para instruir a IA a gerar links no formato `?highlight=termo_chave`.

### Efeito de Highlight
Precisamos de um script e estilos para capturar o parâmetro da URL e destacar o texto.
#### [NEW] `public/scripts/highlight.js`
- Script vanilla JavaScript que lê `URLSearchParams`, usa a API do navegador para encontrar o texto (ex: manipulando o DOM ou usando `window.find()`) e envolve o termo encontrado em uma tag `<mark class="ai-highlight">`.
- Remove o highlight após 3 segundos com uma animação suave.

#### [MODIFY] `src/styles/custom.css`
- Adicionar animações CSS para a classe `.ai-highlight` (ex: fundo amarelo vibrante que suaviza para transparente).

#### [MODIFY] `astro.config.mjs`
- Injetar o novo script `highlight.js` na tag `<head>` de todas as páginas do Starlight usando a configuração `head` nativa do Astro.

## Open Questions

> [!IMPORTANT]
> **Sobre o Provedor Groq:** Você concorda em criarmos uma conta rápida e gratuita no **Groq** para obter a chave API sem precisar de cartão de crédito? (Leva literalmente 1 minuto).

> [!NOTE]
> **Sobre o Highlight:** Você prefere que o texto fique com um fundo amarelo permanente até o usuário clicar em algo, ou prefere que ele "pisque" e desapareça suavemente após alguns segundos (efeito temporário)?

## Verification Plan
1. Obter a chave gratuita do Groq.
2. Inserir a chave no ambiente de dev local.
3. Perguntar ao chat sobre um processo específico.
4. Clicar no link gerado na resposta da IA.
5. Verificar se a página carrega, rola até o ponto exato e o texto brilha em amarelo conforme esperado.
