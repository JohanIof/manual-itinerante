document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const highlightTerm = urlParams.get('highlight');

  if (highlightTerm) {
    // Basic text search and highlight
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapeRegExp(highlightTerm)})`, 'gi');
    
    // Find text nodes in the main content area
    const contentArea = document.querySelector('main') || document.body;
    
    const walker = document.createTreeWalker(
      contentArea,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    const textNodes = [];
    while ((node = walker.nextNode())) {
      // Skip if inside a script, style, or already highlighted
      if (
        node.parentNode.nodeName === 'SCRIPT' ||
        node.parentNode.nodeName === 'STYLE' ||
        node.parentNode.classList.contains('ai-highlight')
      ) {
        continue;
      }
      if (node.nodeValue.match(regex)) {
        textNodes.push(node);
      }
    }

    if (textNodes.length > 0) {
      // Highlight the first occurrence
      const firstNode = textNodes[0];
      const span = document.createElement('span');
      span.innerHTML = firstNode.nodeValue.replace(regex, '<mark class="ai-highlight">$1</mark>');
      firstNode.parentNode.replaceChild(span, firstNode);

      // Scroll to the highlighted element
      const highlightedEl = document.querySelector('.ai-highlight');
      if (highlightedEl) {
        setTimeout(() => {
          highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); // Small delay to let page settle

        // Remove the highlight class after animation finishes (e.g., 4 seconds)
        setTimeout(() => {
          highlightedEl.classList.add('fade-out');
        }, 3000);
      }
    }
  }
});
