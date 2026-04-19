import React from 'react'
import logo from './logo.svg'
import './App.css'
import { useTranslation, Trans } from 'react-i18next'
import { ColorPicker, readableOn } from './ColorPicker'
import { ConfirmDialog } from './ConfirmDialog'

interface Color {
  name: string
  hex: string
}

const App = () => {
  const { t, i18n } = useTranslation()

  const [colors, setColors] = React.useState<Color[]>([])
  const [backgroundColor, setBackgroundColor] = React.useState('#1abc9c')
  const [activeName, setActiveName] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [pickerError, setPickerError] = React.useState<string | null>(null)

  const [confirmTarget, setConfirmTarget] = React.useState<Color | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/colors')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then((data: Color[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setColors(data)
          setBackgroundColor(data[0].hex)
          setActiveName(data[0].name)
        }
      })
      .catch(() => setError('Failed to load colors'))
  }, [])

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }

  const handleColorClick = async (colorName: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/colors/${encodeURIComponent(colorName)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      if (data && data.hex) {
        setBackgroundColor(data.hex)
        setActiveName(data.name)
      }
    } catch {
      setError(`Failed to load color: ${colorName}`)
    }
  }

  const handleAddColor = async ({ name, hex }: { name: string; hex: string }) => {
    setSaving(true)
    setPickerError(null)
    try {
      const res = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hex })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        let msg = data.error || `Request failed (HTTP ${res.status})`
        if (res.status === 409) msg = data.error || `A color named "${name}" already exists.`
        if (res.status === 429) msg = 'Too many requests. Try again in a moment.'
        if (res.status >= 500) msg = 'Server error. Please try again.'
        setPickerError(msg)
        return
      }
      const listRes = await fetch('/api/colors')
      const list: Color[] = await listRes.json()
      setColors(list)
      setBackgroundColor(data.hex)
      setActiveName(data.name)
      setPickerOpen(false)
    } catch {
      setPickerError('Network error — could not reach the server.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteColor = async () => {
    if (!confirmTarget) return
    const target = confirmTarget
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/colors/${encodeURIComponent(target.name)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || `Failed to delete "${target.name}"`)
        return
      }
      const listRes = await fetch('/api/colors')
      const list: Color[] = await listRes.json()
      setColors(list)
      if (activeName === target.name) {
        if (list.length > 0) {
          setBackgroundColor(list[0].hex)
          setActiveName(list[0].name)
        } else {
          setActiveName(null)
        }
      }
      setConfirmTarget(null)
    } catch {
      setError('Network error — could not delete color.')
    } finally {
      setDeleting(false)
    }
  }

  const labelFor = (c: Color): string => {
    const key = c.name.toLowerCase()
    const translated = t(`colors.${key}`, { defaultValue: '' })
    return translated || c.name
  }

  const textColor = readableOn(backgroundColor)

  return (
    <div className='App'>
      <main>
        <header className='App-header' style={{ backgroundColor, color: textColor }}>
          <div className='language-selector'>
            <select aria-label={t('languageSelector')} value={i18n.resolvedLanguage} onChange={changeLanguage}>
              <option value='en'>English</option>
              <option value='es'>Español</option>
              <option value='el'>Ελληνικά</option>
            </select>
          </div>

          <img src={logo} className='App-logo' alt='logo' />
          <h1>{t('title')}</h1>

          {error && (
            <div className='error-message' role='alert'>
              {error}
            </div>
          )}

          <p>
            <Trans i18nKey='instructions'>
              Edit <code>src/App.js</code> and save to reload.
            </Trans>
          </p>

          <a
            className='App-link'
            href='https://reactjs.org'
            target='_blank'
            rel='noopener noreferrer'
            style={{ color: textColor === '#fff' ? '#cfe8ff' : '#003366' }}
          >
            {t('learnReact')}
          </a>

          <span aria-live='polite' className='current-color'>
            {t('currentColor')} {backgroundColor}
          </span>

          <div className='btn-group-colors'>
            {colors.length === 0 && <p>{t('loading')}</p>}
            {colors.map((c) => (
              <span key={c.name} className={`color-chip${activeName === c.name ? ' is-active' : ''}`}>
                <button
                  onClick={() => handleColorClick(c.name)}
                  aria-label={`${t('changeColor')} ${labelFor(c)}`}
                  aria-pressed={activeName === c.name}
                  title={c.hex}
                  className='chip-main'
                >
                  <span className='swatch' style={{ background: c.hex }} />
                  {labelFor(c)}
                </button>
                <button
                  className='chip-x'
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmTarget(c)
                  }}
                  aria-label={`${t('remove')}: ${labelFor(c)}`}
                  title={`${t('remove')}: ${labelFor(c)}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              className='btn-add'
              onClick={() => {
                setPickerError(null)
                setPickerOpen(true)
              }}
              aria-label={t('add')}
            >
              {t('add')}
            </button>
          </div>
        </header>
      </main>

      {pickerOpen && (
        <ColorPicker
          existingNames={colors.map((c) => c.name)}
          saving={saving}
          serverError={pickerError}
          onClearError={() => setPickerError(null)}
          onConfirm={handleAddColor}
          onCancel={() => {
            if (!saving) {
              setPickerOpen(false)
              setPickerError(null)
            }
          }}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={t('confirmTitle')}
          body={<Trans i18nKey='confirmBody' values={{ name: labelFor(confirmTarget) }} components={{ b: <b /> }} />}
          swatch={confirmTarget.hex}
          confirmLabel={deleting ? t('deleting') : t('delete')}
          cancelLabel={t('cancel')}
          busy={deleting}
          onConfirm={handleDeleteColor}
          onCancel={() => {
            if (!deleting) setConfirmTarget(null)
          }}
        />
      )}
    </div>
  )
}

export default App
