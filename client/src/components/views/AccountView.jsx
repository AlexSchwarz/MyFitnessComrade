import { useState } from 'react'

function AccountView({ userEmail, userId, onLogout, onSeedFoods, dailyGoal, onSaveGoal }) {
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
                <div className="goal-edit-buttons">
                  <button
                    onClick={handleSaveGoal}
                    className="button-small"
                    disabled={goalSaving}
                  >
                    {goalSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="button-small button-cancel"
                    disabled={goalSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="goal-display">
                <span className="account-value">{dailyGoal} cal</span>
                <button onClick={handleEditGoal} className="button-edit">
                  Edit
                </button>
              </div>
            )}
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
