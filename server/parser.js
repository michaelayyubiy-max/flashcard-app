/**
 * Smart Word Parser for Telegram Bot
 * Parses messages into array of { word, translation }
 */

export function parseWordsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const cleaned = text.trim();
  if (!cleaned) return [];

  // Ignore bot commands like /start, /help, etc.
  if (cleaned.startsWith('/')) return [];

  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const results = [];

  // Delimiter pattern: -, —, –, =, :, ->, =>, tab, or 2+ spaces
  const delimiterRegex = /\s*(?:[-—–=:]|->|=>|\t)\s*|\s{2,}/;

  // If there are exactly 2 lines and neither contains a delimiter, treat line 0 as word, line 1 as translation
  if (lines.length === 2 && !delimiterRegex.test(lines[0]) && !delimiterRegex.test(lines[1])) {
    const word = lines[0].replace(/^["']|["']$/g, '').trim();
    const translation = lines[1].replace(/^["']|["']$/g, '').trim();
    if (word && translation) {
      results.push({ word, translation });
      return results;
    }
  }

  // Check if text has double-newline separated blocks (each block having 2 lines)
  const blocks = cleaned.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  if (blocks.length > 1 && blocks.every(b => b.split('\n').map(l => l.trim()).filter(Boolean).length === 2 && !delimiterRegex.test(b))) {
    for (const block of blocks) {
      const bLines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (bLines.length === 2) {
        results.push({
          word: bLines[0].replace(/^["']|["']$/g, '').trim(),
          translation: bLines[1].replace(/^["']|["']$/g, '').trim()
        });
      }
    }
    if (results.length > 0) return results;
  }

  // Process line by line
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if line contains a delimiter: -, —, –, =, :, ->, =>, tab, or 2+ spaces
    if (delimiterRegex.test(line)) {
      const parts = line.split(delimiterRegex).map(p => p.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
      if (parts.length >= 2) {
        const word = parts[0];
        const translation = parts.slice(1).join(' - ');
        results.push({ word, translation });
        i++;
        continue;
      }
    }

    // Check single space if line has 2 words e.g. "apple olma"
    const singleSpaceParts = line.split(/\s+/).map(p => p.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
    if (singleSpaceParts.length === 2) {
      results.push({
        word: singleSpaceParts[0],
        translation: singleSpaceParts[1]
      });
      i++;
      continue;
    }

    // If next line exists, treat as 2-line pair
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      results.push({
        word: line.replace(/^["']|["']$/g, '').trim(),
        translation: nextLine.replace(/^["']|["']$/g, '').trim()
      });
      i += 2;
      continue;
    }

    // If single line with multiple words and no delimiter, treat first word as word, rest as translation
    if (singleSpaceParts.length > 2) {
      results.push({
        word: singleSpaceParts[0],
        translation: singleSpaceParts.slice(1).join(' ')
      });
      i++;
      continue;
    }

    i++;
  }

  return results;
}
