import defaultCards from '../data/millennium.json';

const STORAGE_KEY = 'millennium_custom_overrides_v1';

export const BLOCKS = [
  { id: 'all', label: 'Barchasi', range: [0, 999], name: '000–999 (1,000 ta)' },
  { id: 'b0', label: '000–099', range: [0, 99], name: '000–099 (Noliklar · Z/S)' },
  { id: 'b1', label: '100–199', range: [100, 199], name: '100–199 (Birlar · T/D)' },
  { id: 'b2', label: '200–299', range: [200, 299], name: '200–299 (Ikkilar · N/H)' },
  { id: 'b3', label: '300–399', range: [300, 399], name: '300–399 (Uchlar · M/J)' },
  { id: 'b4', label: '400–499', range: [400, 499], name: '400–499 (To\'rtlar · R/Ch)' },
  { id: 'b5', label: '500–599', range: [500, 599], name: '500–599 (Beshlar · L/Sh)' },
  { id: 'b6', label: '600–699', range: [600, 699], name: '600–699 (Oltilar · B/P)' },
  { id: 'b7', label: '700–799', range: [700, 799], name: '700–799 (Yettilar · K/Q)' },
  { id: 'b8', label: '800–899', range: [800, 899], name: '800–899 (Sakkizlar · F/V)' },
  { id: 'b9', label: '900–999', range: [900, 999], name: '900–999 (To\'qqizlar · G/Y)' },
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
