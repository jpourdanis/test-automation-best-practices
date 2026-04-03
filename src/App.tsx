import React from 'react'
import logo from './logo.svg'
import './App.css'
import { useTranslation, Trans } from 'react-i18next'

const App = () => {
  const [backgroundColor, setBackgroundColor] = React.useState('#1abc9c')
  const [colors, setColors] = React.useState<{ name: string; hex: string }[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const { t, i18n } = useTranslation()

  React.useEffect(() => {
    fetch('/api/colors')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setColors(data)
          setBackgroundColor(data[0].hex)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch colors:', err)
        setError('Failed to load colors')
      })
  }, [])

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }

  const handleColorClick = async (colorName: string) => {
    setError(null) // Clear previous errors
    try {
      // Ensure we hit the backend every time instead of using browser cache
      const res = await fetch(`/api/colors/${colorName}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      if (data && data.hex) {
        setBackgroundColor(data.hex)
      }
    } catch (err) {
      console.error(`Failed to fetch hex for ${colorName}`, err)
      setError(`Failed to load color: ${colorName}`)
    }
  }

  return (
    <div className='App'>
      <main>
        <header className='App-header' style={{ backgroundColor }}>
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
          <a className='App-link' href='https://reactjs.org' target='_blank' rel='noopener noreferrer'>
            {t('learnReact')}
          </a>
          <span aria-live='polite'>
            {t('currentColor')} {backgroundColor}
          </span>
          <div className='btn-group-colors'>
            {colors.length > 0 ? (
              colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleColorClick(c.name)}
                  aria-label={`${t('changeColor')} ${t(`colors.${c.name.toLowerCase()}`)}`}
                >
                  {t(`colors.${c.name.toLowerCase()}`)}
                </button>
              ))
            ) : (
              <p>Loading colors...</p>
            )}
          </div>
        </header>
      </main>
    </div>
  )
}

export default App
