export type Rarity = 0 | 1 | 2 | 3 | 4

export const RARITY_ICON: Record<Rarity, string> = {
  0: '▪', 1: '●', 2: '♦', 3: '★', 4: '👑',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  0: '#888780',
  1: '#1D9E75',
  2: '#4655e0',
  3: '#b437ee',
  4: '#f08000',
}

export const RARITY_BADGE_STYLES: Record<Rarity, { bg: string; color: string }> = {
  0: { bg: '#F1EFE8', color: '#5F5E5A' },
  1: { bg: '#E1F5EE', color: '#0F6E56' },
  2: { bg: '#E6F1FB', color: '#185FA5' },
  3: { bg: '#EEEDFE', color: '#3C3489' },
  4: { bg: '#FAEEDA', color: '#854F0B' },
};