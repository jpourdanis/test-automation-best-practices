import React, { useState, useRef, useEffect, useCallback } from 'react'

// ---------- color conversion helpers ----------
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0,
    g = 0,
    b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toLowerCase()
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  return [h, s, l]
}

export function readableOn(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#111'
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.55 ? '#111' : '#fff'
}

// ---------- Color Wheel canvas ----------
interface ColorWheelProps {
  hue: number
  sat: number
  onChange: (hue: number, sat: number) => void
  size?: number
}

function ColorWheel({ hue, sat, onChange, size = 220 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    c.width = size * dpr
    c.height = size * dpr
    c.style.width = size + 'px'
    c.style.height = size + 'px'
    ctx.scale(dpr, dpr)
    const r = size / 2
    const img = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - r,
          dy = y - r
        const dist = Math.sqrt(dx * dx + dy * dy)
        const i = (y * size + x) * 4
        if (dist > r) {
          img.data[i + 3] = 0
        } else {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI
          if (angle < 0) angle += 360
          const s = Math.min(1, dist / r)
          const [rr, gg, bb] = hslToRgb(angle, s, 0.5)
          img.data[i] = rr
          img.data[i + 1] = gg
          img.data[i + 2] = bb
          const a = dist > r - 1 ? r - dist : 1
          img.data[i + 3] = Math.max(0, Math.min(255, a * 255))
        }
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [size])

  const handlePoint = useCallback(
    (clientX: number, clientY: number) => {
      const c = canvasRef.current
      if (!c) return
      const rect = c.getBoundingClientRect()
      const r = size / 2
      const x = clientX - rect.left - r
      const y = clientY - rect.top - r
      let dist = Math.sqrt(x * x + y * y)
      if (dist > r) dist = r
      let angle = (Math.atan2(y, x) * 180) / Math.PI
      if (angle < 0) angle += 360
      onChange(angle, Math.min(1, dist / r))
    },
    [onChange, size]
  )

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true
    const t = 'touches' in e ? e.touches[0] : e
    handlePoint(t.clientX, t.clientY)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const t = 'touches' in e ? e.touches[0] : e
      handlePoint(t.clientX, t.clientY)
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [handlePoint])

  const r = size / 2
  const rad = (hue * Math.PI) / 180
  const cx = r + Math.cos(rad) * sat * r
  const cy = r + Math.sin(rad) * sat * r

  return (
    <div className='wheel-wrap' style={{ width: size, height: size }}>
      <canvas ref={canvasRef} onMouseDown={onDown} onTouchStart={onDown} className='wheel-canvas' />
      <div className='wheel-cursor' style={{ left: cx, top: cy }} />
    </div>
  )
}

// ---------- ColorPicker modal ----------
export interface ColorPickerProps {
  existingNames: string[]
  saving: boolean
  serverError: string | null
  onClearError: () => void
  onConfirm: (color: { name: string; hex: string }) => void
  onCancel: () => void
}

export function ColorPicker({
  existingNames,
  saving,
  serverError,
  onClearError,
  onConfirm,
  onCancel
}: ColorPickerProps) {
  const [hue, setHue] = useState(210)
  const [sat, setSat] = useState(0.8)
  const [light, setLight] = useState(0.5)
  const [hexInput, setHexInput] = useState('')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [hexError, setHexError] = useState('')
  const [wheelSize, setWheelSize] = useState(220)
  const leftRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = leftRef.current
    if (!el) return
    const compute = () => {
      const w = el.clientWidth || 220
      setWheelSize(Math.max(160, Math.min(260, Math.floor(w))))
    }
    compute()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(compute)
      ro.observe(el)
      return () => ro.disconnect()
    } else {
      window.addEventListener('resize', compute)
      return () => window.removeEventListener('resize', compute)
    }
  }, [])

  const [r, g, b] = hslToRgb(hue, sat, light)
  const hex = rgbToHex(r, g, b)

  useEffect(() => {
    setHexInput(hex)
    setHexError('')
  }, [hex])

  const onWheelChange = (h: number, s: number) => {
    setHue(h)
    setSat(s)
  }

  const onHexChange = (v: string) => {
    setHexInput(v)
    const rgb = hexToRgb(v.startsWith('#') ? v : '#' + v)
    if (rgb) {
      const [h, s, l] = rgbToHsl(...rgb)
      setHue(h)
      setSat(s)
      setLight(l)
      setHexError('')
    } else {
      setHexError('Use format #RRGGBB')
    }
  }

  const STRICT = /^[a-zA-Z0-9]([a-zA-Z0-9 +]*[a-zA-Z0-9])?$/

  useEffect(() => {
    if (serverError) onClearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const submit = () => {
    const n = name.trim()
    if (!n) {
      setNameError('Name is required')
      return
    }
    if (!STRICT.test(n)) {
      setNameError('Letters, numbers, spaces, + only')
      return
    }
    if (existingNames.some((e) => e.toLowerCase() === n.toLowerCase())) {
      setNameError(`"${n}" already exists`)
      return
    }
    if (hexError) return
    onConfirm({ name: n, hex })
  }

  const gradRgbMid = hslToRgb(hue, sat, 0.5)
  const sliderBg = `linear-gradient(to right, #000 0%, rgb(${gradRgbMid.join(',')}) 50%, #fff 100%)`

  return (
    <div className='picker-backdrop' onClick={onCancel}>
      <div
        className='picker-card'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-label='Add custom color'
      >
        <div className='picker-head'>
          <h2>Add a color</h2>
          <button className='picker-x' onClick={onCancel} aria-label='Close'>
            ×
          </button>
        </div>

        <div className='picker-body'>
          <div className='picker-left' ref={leftRef}>
            <ColorWheel hue={hue} sat={sat} onChange={onWheelChange} size={wheelSize} />
            <div className='slider-row'>
              <span className='slider-label'>Lightness</span>
              <input
                type='range'
                min='0'
                max='100'
                value={Math.round(light * 100)}
                onChange={(e) => setLight(Number(e.target.value) / 100)}
                style={{ background: sliderBg }}
                className='lightness-slider'
                aria-label='Lightness'
              />
            </div>
          </div>

          <div className='picker-right'>
            <div className='preview' style={{ background: hex, color: readableOn(hex) }}>
              <span className='preview-hex'>{hex.toUpperCase()}</span>
            </div>

            <label className='field'>
              <span>Name</span>
              <input
                type='text'
                value={name}
                placeholder='e.g. Ocean'
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                maxLength={24}
                aria-invalid={!!nameError}
              />
              {nameError && <em className='err'>{nameError}</em>}
            </label>

            <label className='field'>
              <span>Hex</span>
              <input
                type='text'
                value={hexInput}
                onChange={(e) => onHexChange(e.target.value)}
                spellCheck={false}
                aria-invalid={!!hexError}
              />
              {hexError && <em className='err'>{hexError}</em>}
            </label>

            <div className='picker-actions'>
              <button className='btn-ghost' onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button className='btn-primary' onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Add color'}
              </button>
            </div>

            {serverError && (
              <div className='server-error' role='alert'>
                <span className='server-error-icon' aria-hidden='true'>
                  !
                </span>
                <span>{serverError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
