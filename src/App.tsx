import React, { useEffect, useMemo, useRef, useState } from 'react'
import chroma from 'chroma-js'
import * as colorBlind from 'color-blind'
import { contrastRatio, wcagLevel } from './contrast'
import { SvgFilters, filterUrl, SimType, simLabels } from './colorSim'

type Pair = {
  fg: string
  bg: string
}

const DEFAULT_PAIR: Pair = { fg: '#2b2b2b', bg: '#ffffff' }

const simList: SimType[] = ['none','protanopia','deuteranopia','tritanopia','achromatopsia']

function isValidColor(str: string): boolean {
  try {
    chroma(str.trim())
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [pair, setPair] = useState<Pair>(DEFAULT_PAIR)
  const [fontSize, setFontSize] = useState<number>(16)
  const [bold, setBold] = useState<boolean>(false)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // 入力補正（先頭に # を付けて正規化）
  const normFg = useMemo(() => toHex(pair.fg), [pair.fg])
  const normBg = useMemo(() => toHex(pair.bg), [pair.bg])

  const ratio = useMemo(() => contrastRatio(normFg, normBg), [normFg, normBg])
  const level = useMemo(() => wcagLevel(ratio, fontSize, bold), [ratio, fontSize, bold])

  function toHex(v: string): string {
    let s = v.trim()
    if (!s.startsWith('#')) s = '#' + s
    // chroma で一旦正規化して 6桁HEX に
    try {
      return chroma(s).hex()
    } catch {
      return s
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgUrl(url)
  }

  // 文字色×背景色の各シミュレーション（color-blindは単色の近似）
  const simulatedPairs = useMemo(() => {
    const entries = simList.map(sim => {
      if (sim === 'none') return [sim, pair] as const
      try {
        // 型エラー回避: colorBlind を any 型で扱う
        const cb: any = colorBlind
        const fg = cb[sim](normFg)
        const bg = cb[sim](normBg)
        return [sim, { fg, bg }] as const
      } catch {
        return [sim, pair] as const
      }
    })
    return entries
  }, [pair, normFg, normBg])

  // アクセシビリティ用の簡易スタイル
  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  }

  // 左右の枠線スタイル
  const leftCardStyle: React.CSSProperties = {
    border: '3px solid #1976d2', // 左：青系
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    background: '#f7fbff'
  }
  const rightCardStyle: React.CSSProperties = {
    border: '3px solid #e57300', // 右：オレンジ系
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    background: '#fff8f2'
  }
  const titleBlockStyle: React.CSSProperties = {
    padding: '12px 0 12px 0',
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: 1,
    background: '#f0f4fa',
    borderRadius: 10,
    marginBottom: 8
  }

  return (
    <div style={{
      padding: 20,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    }}>
      <SvgFilters />

      <h1 style={{ fontSize: 24, marginBottom: 8 }}>UD Color Viewer（簡易版）</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        画像の色覚シミュレーションと、文字色×背景色のコントラスト判定（WCAG）を試す最小アプリです。
      </p>

      {/* 6分割レイアウト */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto 1fr 1fr',
          gap: 16,
          marginTop: 16,
          minHeight: 700
        }}
      >
        {/* 左上：タイトル */}
        <div style={{ gridColumn: '1 / 2', gridRow: '1 / 2' }}>
          <div style={{ ...titleBlockStyle, background: '#e3f2fd', color: '#1976d2', border: '2px solid #1976d2' }}>
            文字色・背景色の検証
          </div>
        </div>
        {/* 右上：タイトル */}
        <div style={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>
          <div style={{ ...titleBlockStyle, background: '#fff3e0', color: '#e57300', border: '2px solid #e57300' }}>
            画像の検証
          </div>
        </div>

        {/* 左中：文字色と背景色 */}
        <div style={{ ...leftCardStyle, gridColumn: '1 / 2', gridRow: '2 / 3' }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>文字色と背景色</h2>

          <label>文字色（hex）</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={pair.fg}
              onChange={(e) => setPair(p => ({ ...p, fg: e.target.value }))}
              placeholder="#222222"
              style={{ flex: 1, padding: 8 }}
            />
            <input
              type="color"
              value={isValidColor(normFg) ? normFg : '#000000'}
              onChange={(e) => setPair(p => ({ ...p, fg: e.target.value }))}
            />
          </div>

          <label>背景色（hex）</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={pair.bg}
              onChange={(e) => setPair(p => ({ ...p, bg: e.target.value }))}
              placeholder="#ffffff"
              style={{ flex: 1, padding: 8 }}
            />
            <input
              type="color"
              value={isValidColor(normBg) ? normBg : '#ffffff'}
              onChange={(e) => setPair(p => ({ ...p, bg: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
            <label>
              フォントサイズ(px)
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ marginLeft: 8, width: 80 }}
                min={10}
                max={64}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              太字
            </label>
          </div>

          <div style={{
            marginTop: 12,
            border: '1px dashed #ddd',
            borderRadius: 8,
            padding: 12,
            background: normBg,
            color: normFg,
            fontSize,
            fontWeight: bold ? 700 : 400
          }}>
            サンプルテキスト：色とコントラストを確認してください。
          </div>

          <div style={{ marginTop: 12, fontSize: 14 }}>
            <strong>コントラスト比：</strong>
            {ratio ? ratio.toFixed(2) : '—'}
            {'　'}
            <strong>判定：</strong>
            {level}
          </div>
        </div>

        {/* 右中：画像アップロード */}
        <div style={{ ...rightCardStyle, gridColumn: '2 / 3', gridRow: '2 / 3' }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>画像アップロード（任意）</h2>
          <input type="file" accept="image/*" onChange={onFileChange} />
          {imgUrl ? (
            <figure style={{ margin: 0, marginTop: 12 }}>
              <img
                ref={imgRef}
                src={imgUrl}
                alt="original"
                style={{
                  width: '90%',
                  maxWidth: '90%',
                  height: 'auto',
                  maxHeight: 220,
                  display: 'block',
                  borderRadius: 8,
                  border: '1px solid #eee',
                  objectFit: 'contain',
                  background: '#fafafa'
                }}
              />
              <figcaption style={{ fontSize: 14, marginTop: 6, color: '#888' }}>アップロード画像（通常視）</figcaption>
            </figure>
          ) : (
            <p style={{ color: '#666', marginTop: 8 }}>画像を選ぶと右下で色覚シミュレーションを確認できます。</p>
          )}
        </div>

        {/* 左下：色覚タイプ別プレビュー（文字色×背景色） */}
        <div style={{ ...leftCardStyle, gridColumn: '1 / 2', gridRow: '3 / 5' }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>色覚タイプ別プレビュー（文字色×背景色）</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {simulatedPairs.map(([sim, p]) => {
              const r = contrastRatio(p.fg, p.bg)
              const lv = wcagLevel(r, fontSize, bold)
              return (
                <div key={sim} style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: 8, fontSize: 13, background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    {simLabels[sim]}
                  </div>
                  <div style={{ padding: 12, background: p.bg, color: p.fg, fontSize, fontWeight: bold ? 700 : 400 }}>
                    サンプル：見え方の相違を確認
                  </div>
                  <div style={{ padding: 8, fontSize: 12 }}>
                    比 {r ? r.toFixed(2) : '—'} / 判定 {lv}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 右下：画像シミュレーション */}
        <div style={{ ...rightCardStyle, gridColumn: '2 / 3', gridRow: '3 / 5', minHeight: 240 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>画像シミュレーション（選択）</h2>
          {imgUrl ? (
            <SimulatedImage src={imgUrl} />
          ) : (
            <p style={{ color: '#666', marginTop: 8 }}>画像をアップロードすると色覚シミュレーション結果が表示されます。</p>
          )}
        </div>
      </div>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#888' }}>
        ※ 本アプリのシミュレーションは近似です。実機やユーザテストによる確認と併用してください。
      </footer>
    </div>
  )
}

function SimulatedImage({ src }: { src: string }) {
  const [sim, setSim] = useState<SimType>('deuteranopia')

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14 }}>シミュレーション：</label>
        <select value={sim} onChange={(e) => setSim(e.target.value as SimType)}>
          {simList.map(s => (
            <option key={s} value={s}>{simLabels[s]}</option>
          ))}
        </select>
      </div>
      <div style={{
        filter: filterUrl(sim) || '',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 120
      }}>
        <img
          src={src}
          alt="simulated"
          style={{
            width: '90%',
            height: 'auto',
            maxWidth: '90%',
            maxHeight: '90%',
            display: 'block',
            borderRadius: 8,
            border: '1px solid #eee',
            objectFit: 'contain',
            background: '#fafafa'
          }}
        />
      </div>
    </div>
  )
}
