/**
 * Helper to auto-fit flashcard text.
 * Maintains large font (32px) for standard words/phrases,
 * and dynamically shrinks font size only when text overflows the card boundaries.
 */
export function fitCardText(textEl) {
  if (!textEl) return;
  const parent = textEl.parentElement;
  if (!parent) return;

  // Reset to default max font size
  let fontSize = 32;
  textEl.style.fontSize = `${fontSize}px`;
  textEl.style.lineHeight = '1.35';
  textEl.style.overflowY = 'visible';
  textEl.style.maxHeight = 'none';

  // Available container bounds (safe inside card)
  const maxH = (parent.clientHeight && parent.clientHeight > 50) ? (parent.clientHeight - 36) : 330;
  const maxW = (parent.clientWidth && parent.clientWidth > 50) ? (parent.clientWidth - 20) : 290;

  // Progressively reduce font size only if text overflows
  while (
    fontSize > 13 &&
    (textEl.scrollHeight > maxH || textEl.scrollWidth > maxW)
  ) {
    fontSize -= 1;
    textEl.style.fontSize = `${fontSize}px`;
    textEl.style.lineHeight = fontSize <= 18 ? '1.45' : '1.35';
  }

  // If extremely long text exceeds capacity even at 13px, enable smooth scroll
  if (textEl.scrollHeight > maxH) {
    textEl.style.maxHeight = `${maxH}px`;
    textEl.style.overflowY = 'auto';
  }
}

/**
 * Fits both front and back sides of a flashcard container
 */
export function fitAllCardTexts(cardContainer) {
  if (!cardContainer) return;
  const textEls = cardContainer.querySelectorAll('.card-text');
  textEls.forEach(el => fitCardText(el));
}
