import defaultCards from '../data/millennium.json';

const STORAGE_KEY = 'millennium_custom_overrides_v2';

export const BLOCKS = [
  { id: 'all', label: 'Barchasi', range: [50, 99], name: '050–099 (50 ta)' },
  { id: 'b0_5', label: '050–059', range: [50, 59], name: '050–059 (10 ta · 5=A)' },
  { id: 'b0_6', label: '060–069', range: [60, 69], name: '060–069 (10 ta · 6=I)' },
  { id: 'b0_7', label: '070–079', range: [70, 79], name: '070–079 (10 ta · 7=U)' },
  { id: 'b0_8', label: '080–089', range: [80, 89], name: '080–089 (10 ta · 8=E)' },
  { id: 'b0_9', label: '090–099', range: [90, 99], name: '090–099 (10 ta · 9=O)' },
];

function getOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

export function getAllMillenniumCards() {
  const overrides = getOverrides();
  return defaultCards.map(card => {
    const custom = overrides[card.number];
    if (custom) {
      return {
        ...card,
        word: custom.word || card.word,
        desc: custom.desc !== undefined ? custom.desc : card.desc,
        isCustom: true
      };
    }
    return { ...card, isCustom: false };
  });
}

export function getMillenniumCard(numStr) {
  const padded = String(numStr).padStart(3, '0');
  const all = getAllMillenniumCards();
  return all.find(c => c.number === padded) || null;
}

export function updateMillenniumCard(numStr, newWord, newDesc) {
  const padded = String(numStr).padStart(3, '0');
  const overrides = getOverrides();
  overrides[padded] = {
    word: (newWord || '').trim(),
    desc: (newDesc || '').trim(),
    updatedAt: Date.now()
  };
  saveOverrides(overrides);
  return getMillenniumCard(padded);
}

export function resetMillenniumCard(numStr) {
  const padded = String(numStr).padStart(3, '0');
  const overrides = getOverrides();
  delete overrides[padded];
  saveOverrides(overrides);
  return getMillenniumCard(padded);
}

export function resetAllMillenniumCards() {
  localStorage.removeItem(STORAGE_KEY);
}
