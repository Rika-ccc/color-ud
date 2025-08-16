export type SimType =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia';

export const simLabels: Record<SimType, string> = {
  none: '通常視',
  protanopia: 'プロタノピア（赤錐体）',
  deuteranopia: 'デューテラノピア（緑錐体）',
  tritanopia: 'トリタノピア（青錐体）',
  achromatopsia: '全色盲（単色視）',
};

// 各種 3x3 色変換マトリクス（行＝出力R,G,B；列＝入力R,G,B）
// 参考として広く使われる近似値
const matrices: Record<Exclude<SimType, 'none'>, number[]> = {
  protanopia: [
    0.567, 0.433, 0.000,
    0.558, 0.442, 0.000,
    0.000, 0.242, 0.758
  ],
  deuteranopia: [
    0.625, 0.375, 0.000,
    0.700, 0.300, 0.000,
    0.000, 0.300, 0.700
  ],
  tritanopia: [
    0.950, 0.050, 0.000,
    0.000, 0.433, 0.567,
    0.000, 0.475, 0.525
  ],
  achromatopsia: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114
  ],
};

export function SvgFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {Object.entries(matrices).map(([key, m]) => (
          <filter id={`sim-${key}`} key={key}>
            <feColorMatrix
              type="matrix"
              values={`
                ${m[0]} ${m[1]} ${m[2]} 0 0
                ${m[3]} ${m[4]} ${m[5]} 0 0
                ${m[6]} ${m[7]} ${m[8]} 0 0
                0 0 0 1 0
              `}
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

export function filterUrl(type: SimType): string | undefined {
  if (type === 'none') return undefined;
  return `url(#sim-${type})`;
}
