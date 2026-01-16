import { useState } from 'react'
import FoodPicker from '../FoodPicker'

function TodayView({
  // Summary props
  dailyGoal,
  totalCalories,
  remainingCalories,
  percentageConsumed,
  // Entry form props
  foods,
  selectedFoodId,
  setSelectedFoodId,
  grams,
  setGrams,
  calculatedCalories,
  entryError,
  entryLoading,
  editingEntryId,
  handleAddEntry,
  handleCancelEditEntry,
  // Entries list props
  entries,
  handleEditEntry,
  handleDeleteEntry,
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const selectedFood = foods.find(f => f.id === selectedFoodId)

  const handleFoodSelect = (food) => {
    setSelectedFoodId(food.id)
  }
  return (
    <>
      {/* Calorie Summary */}
      <div className="card summary-card">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Consumed</span>
            <span className="stat-value">{totalCalories}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Goal</span>
            <span className="stat-value">{dailyGoal}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Remaining</span>
            <span className={`stat-value ${remainingCalories < 0 ? 'over-goal' : remainingCalories < dailyGoal * 0.2 ? 'near-goal' : 'under-goal'}`}>
              {remainingCalories}
            </span>
          </div>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(percentageConsumed, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Add Entry Form */}
      <div className="card">
        {editingEntryId && <h2>Edit Entry</h2>}
        <form onSubmit={handleAddEntry}>
          {selectedFood ? (
            <div className="selected-food-summary">
              <div className="selected-food-info">
                <span className="selected-food-name">{selectedFood.name}</span>
                <span className="selected-food-calories">{selectedFood.caloriesPer100g} cal/100g</span>
              </div>
              <button
                type="button"
                className="button-change"
                onClick={() => setIsPickerOpen(true)}
                disabled={entryLoading}
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="food-picker-trigger"
              onClick={() => setIsPickerOpen(true)}
              disabled={entryLoading || foods.length === 0}
            >
              Choose food
            </button>
          )}

          {selectedFoodId && (
            <>
              <div className="grams-quick-add">
                <button
                  type="button"
                  className="quick-add-btn"
                  onClick={() => setGrams(String((parseFloat(grams) || 0) + 100))}
                  disabled={entryLoading}
                >
                  +100
                </button>
                <button
                  type="button"
                  className="quick-add-btn"
                  onClick={() => setGrams(String((parseFloat(grams) || 0) + 50))}
                  disabled={entryLoading}
                >
                  +50
                </button>
                <button
                  type="button"
                  className="quick-add-btn"
                  onClick={() => setGrams(String((parseFloat(grams) || 0) + 10))}
                  disabled={entryLoading}
                >
                  +10
                </button>
                <button
                  type="button"
                  className="quick-add-btn quick-add-btn-clear"
                  onClick={() => setGrams('')}
                  disabled={entryLoading || !grams}
                >
                  Clear
                </button>
              </div>

              <input
                type="number"
                step="0.1"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                placeholder="Amount in grams"
                disabled={entryLoading}
                className="input"
              />
            </>
          )}

          {calculatedCalories > 0 && (
            <div className="calculated-calories">
              <span className="calories-label">Calories:</span>
              <span className="calories-value">{calculatedCalories} cal</span>
            </div>
          )}

          {entryError && (
            <div className="error">
              <p>{entryError}</p>
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              disabled={entryLoading || foods.length === 0 || !selectedFoodId}
              className="button"
            >
              {entryLoading ? (editingEntryId ? 'Updating...' : 'Adding...') : (editingEntryId ? 'Update Entry' : 'Add Entry')}
            </button>
            {editingEntryId && (
              <button
                type="button"
                onClick={handleCancelEditEntry}
                className="button-small"
                disabled={entryLoading}
              >
                Cancel
              </button>
            )}
          </div>

          {foods.length === 0 && (
            <p className="hint">Add foods first before logging entries</p>
          )}
        </form>
      </div>

      {/* Entries List */}
      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">
            <p>No entries logged today</p>
            <p className="empty-state-hint">Start by logging your first entry above!</p>
          </div>
        ) : (
          <div className="entries-list">
            {entries.map(entry => (
              <div key={entry.id} className="entry-card">
                <span className="entry-name">
                  {entry.foodName}
                  {entry.grams && <span className="entry-grams"> ({entry.grams}g)</span>}
                </span>
                <div className="entry-details">
                  <div className="entry-meta">
                    <span className="entry-calories">{entry.calories} cal</span>
                    <span className="entry-time">
                      {new Date(entry.entryTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="entry-actions">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="button-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="button-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FoodPicker
        foods={foods}
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleFoodSelect}
      />
    </>
  )
}

export default TodayView
