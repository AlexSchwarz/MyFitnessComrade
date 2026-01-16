import { useState } from 'react'

function AccountView({ userEmail, userId, onLogout, onSeedFoods }) {
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)

  const handleSeedFoods = async () => {
    setSeeding(true)
    setSeedSuccess(false)
    try {
      await onSeedFoods()
      setSeedSuccess(true)
    } catch (error) {
      console.error('Error seeding foods:', error)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <>
      <div className="card">
        <div className="account-info">
          <div className="account-field">
            <span className="account-label">Email</span>
            <span className="account-value">{userEmail}</span>
          </div>
        </div>
        <button onClick={onLogout} className="button button-logout">
          Logout
        </button>
      </div>
    </>
  )
}

export default AccountView
