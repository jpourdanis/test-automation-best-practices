import React from 'react'
import logo from './logo.svg'
import './App.css'
import { useTranslation, Trans } from 'react-i18next'

const App = () => {
  const [backgroundColor, setBackgroundColor] = React.useState('#1abc9c')
  const [colors, setColors] = React.useState<{ name: string; hex: string }[]>([])
  const { t, i18n } = useTranslation()

  React.useEffect(() => {
    fetch('/api/colors')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setColors(data)
          // Set the initial background color to the first color fetched (optional)
          setBackgroundColor(data[0].hex)
        }
      })
      .catch((err) => console.error('Failed to fetch colors:', err))
  }, [])

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }

  const handleColorClick = async (colorName: string) => {
    try {
      const res = await fetch(`/api/colors/${colorName}`)
      const data = await res.json()
      if (data && data.hex) {
        setBackgroundColor(data.hex)
      }
    } catch (err) {
      console.error(`Failed to fetch hex for ${colorName}`, err)
    }
  }

  return (
    <div className='App'>
      <main>
        <header className='App-header' style={{ backgroundColor }}>
          <div className='language-selector'>
            <select
              aria-label={t('languageSelector')}
              value={i18n.resolvedLanguage}
              onChange={changeLanguage}
            >
              <option value='en'>English</option>
              <option value='es'>Español</option>
              <option value='el'>Ελληνικά</option>
            </select>
          </div>
          <img src={logo} className='App-logo' alt='logo' />
          <h1>{t('title')}</h1>
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
          >
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
