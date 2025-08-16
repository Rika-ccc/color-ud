// 相対輝度の計算（sRGB -> 線形 -> 輝度）
function srgbToLinear(c: number): number {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().replace('#','');
  const s = m.length === 3
    ? m.split('').map(ch => ch + ch).join('')
    : m;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return {
    r: parseInt(s.slice(0,2), 16),
    g: parseInt(s.slice(2,4), 16),
    b: parseInt(s.slice(4,6), 16),
  };
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const R = srgbToLinear(rgb.r);
  const G = srgbToLinear(rgb.g);
  const B = srgbToLinear(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(fgHex: string, bgHex: string): number | null {
  const L1 = relativeLuminance(fgHex);
  const L2 = relativeLuminance(bgHex);
  if (L1 == null || L2 == null) return null;
  const Lmax = Math.max(L1, L2);
  const Lmin = Math.min(L1, L2);
  return (Lmax + 0.05) / (Lmin + 0.05);
}

export function wcagLevel(ratio: number | null, fontSizePx = 16, bold = false): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio == null) return 'Fail';
  // WCAG: 通常テキスト AA=4.5, AAA=7.0 / 大サイズ(>=18.66px or 14px bold) AA=3.0, AAA=4.5
  const isLarge = fontSizePx >= 18.66 || (bold && fontSizePx >= 14);
  if (isLarge) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3.0) return 'AA Large';
    return 'Fail';
  } else {
    if (ratio >= 7.0) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'Fail';
  }
}
