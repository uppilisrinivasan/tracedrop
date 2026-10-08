import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus('connected')
        console.log('API Health:', data)
      })
      .catch(err => {
        setApiStatus('disconnected')
        setError(err.message)
        console.error('API Error:', err)
      })
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>TraceDrop</h1>
        <p>Trace Evidence Management System</p>
        <div className={`status status-${apiStatus}`}>
          API Status: <strong>{apiStatus}</strong>
        </div>
        {error && <p className="error">Error: {error}</p>}
      </header>
    </div>
  )
}

export default App
