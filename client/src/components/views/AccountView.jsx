import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useTheme, ACCENT_COLORS } from '../../contexts/ThemeContext'

function AccountView({ userEmail, userId, onLogout, onSeedFoods, dailyGoal, onSaveGoal }) {
  const { mode, accentColor, toggleMode, setAccentColor } = useTheme()
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)

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

  const handleEditGoal = () => {
    setGoalInput(dailyGoal.toString())
    setIsEditingGoal(true)
  }

  const handleSaveGoal = async () => {
    const newGoal = parseInt(goalInput)
    if (isNaN(newGoal) || newGoal <= 0) {
      return
    }

    try {
      setGoalSaving(true)
      await onSaveGoal(newGoal)
      setIsEditingGoal(false)
    } catch (err) {
      console.error('Error updating goal:', err)
    } finally {
      setGoalSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingGoal(false)
    setGoalInput('')
  }

  return (
    <>
      <div className="card">
        <div className="account-info">
          <div className="account-field">
            <span className="account-label">Email</span>
            <span className="account-value">{userEmail}</span>
          </div>
          <div className="account-field">
            <span className="account-label">Daily Calorie Goal</span>
            {isEditingGoal ? (
              <div className="goal-edit">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="input goal-input"
                  disabled={goalSaving}
                  autoFocus
                />
                <div className="btn-group">
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-outline"
                    disabled={goalSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGoal}
                    className="btn btn-primary"
                    disabled={goalSaving}
                  >
                    {goalSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="goal-display">
                <span className="account-value">{dailyGoal} cal</span>
                <button onClick={handleEditGoal} className="btn btn-icon" aria-label="Edit goal">
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="theme-toggle-field">
            <div className="theme-toggle-label">
              <span>Mode</span>
              <span>{mode === 'dark' ? 'Dark' : 'Light'}</span>
            </div>
            <button
              onClick={toggleMode}
              className={`theme-toggle-switch ${mode === 'light' ? 'active' : ''}`}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            />
          </div>
          <div className="theme-toggle-field">
            <div className="theme-toggle-label">
              <span>Accent Color</span>
            </div>
            <select
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="theme-select"
              aria-label="Select accent color"
            >
              {ACCENT_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-danger btn-block">
          Logout
        </button>
      </div>
    </>
  )
}

export default AccountView
