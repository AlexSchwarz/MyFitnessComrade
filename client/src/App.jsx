import { useState, useEffect } from 'react'
import './App.css'
import { getHealth, logValue } from './services/api'

function App() {
  const [serverStatus, setServerStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [inputValue, setInputValue] = useState('')
  const [logStatus, setLogStatus] = useState(null)
  const [logError, setLogError] = useState(null)
  const [logLoading, setLogLoading] = useState(false)

  useEffect(() => {
    fetchServerHealth()
  }, [])

  const fetchServerHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getHealth()
      setServerStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitValue = async (e) => {
    e.preventDefault()

    if (!inputValue.trim()) {
      setLogError('Please enter a value')
      return
    }

    try {
      setLogLoading(true)
      setLogError(null)
      setLogStatus(null)

      const response = await logValue(inputValue)
      setLogStatus(response.message)
      setInputValue('') // Clear input on success
    } catch (err) {
      setLogError(err.message)
    } finally {
      setLogLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>MyFitnessComrade</h1>

      <div className="card">
        <h2>Server Status</h2>

        {loading && <p>Checking server connection...</p>}

        {error && (
          <div className="error">
            <p>Failed to connect to server</p>
            <p>{error}</p>
          </div>
        )}

        {serverStatus && (
          <div className="success">
            <p>✓ Connected to: {serverStatus.app}</p>
            <p>Status: {serverStatus.message}</p>
          </div>
        )}

        <button onClick={fetchServerHealth}>
          Refresh Status
        </button>
      </div>

      <div className="card">
        <h2>Input Sanity Check</h2>

        <form onSubmit={handleSubmitValue}>
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a value to log..."
              disabled={logLoading}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          {logError && (
            <div className="error">
              <p>{logError}</p>
            </div>
          )}

          {logStatus && (
            <div className="success">
              <p>✓ {logStatus}</p>
            </div>
          )}

          <button type="submit" disabled={logLoading}>
            {logLoading ? 'Submitting...' : 'Submit Value'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
