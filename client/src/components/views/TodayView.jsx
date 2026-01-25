import { useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import FoodPicker from '../FoodPicker'
import USDAImportModal from '../USDAImportModal'
import { useTheme } from '../../contexts/ThemeContext'
import { getFoodCalorieMode, getFoodCalorieLabel } from '../../services/foods'

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
  quantity,
  setQuantity,
  calculatedCalories,
  entryError,
  entryLoading,
  editingEntryId,
  handleAddEntry,
  handleCancelEditEntry,
  // Mode props
  isCustomMode,
  handleSwitchToCustomMode,
  handleSwitchToFoodMode,
  // Custom entry props
  customName,
  setCustomName,
  customCalories,
  setCustomCalories,
  // Entries list props
  entries,
  handleEditEntry,
  handleDeleteEntry,
  // USDA import props
  onUSDAImport,
  usdaImportLoading,
  findExistingUSDAFood,
}) {
  const { lessNumbersMode } = useTheme()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [usdaImportFood, setUsdaImportFood] = useState(null)
  const [existingUSDAFood, setExistingUSDAFood] = useState(null)

  const selectedFood = foods.find(f => f.id === selectedFoodId)

  const handleFoodSelect = (food) => {
    setSelectedFoodId(food.id)
  }

  const handleUSDASelect = async (usdaFood) => {
    // Check for existing import
    const existing = findExistingUSDAFood ? findExistingUSDAFood(usdaFood.fdcId) : null
    setExistingUSDAFood(existing)
    setUsdaImportFood(usdaFood)
  }

  const handleUSDAImport = async (foodData) => {
    const importedFood = await onUSDAImport(foodData)
    if (importedFood) {
      // Select the newly imported food
      setSelectedFoodId(importedFood.id)
      // Close modals
      setUsdaImportFood(null)
      setExistingUSDAFood(null)
      setIsPickerOpen(false)
    }
  }

  const handleUSDAImportClose = (existingFoodToSelect) => {
    if (existingFoodToSelect) {
      // User chose to use existing food
      setSelectedFoodId(existingFoodToSelect.id)
      setIsPickerOpen(false)
    }
    setUsdaImportFood(null)
    setExistingUSDAFood(null)
  }

  // Determine if submit should be disabled
  const isItemMode = selectedFood && getFoodCalorieMode(selectedFood) === 'perItem'
  const isSubmitDisabled = entryLoading || (
    isCustomMode
      ? (!customName.trim() || !customCalories)
      : (!selectedFoodId || (isItemMode ? !quantity : !grams))
  )

  return (
    <>
      {/* Calorie Summary */}
      <div className={`card summary-card ${lessNumbersMode ? 'less-numbers' : ''}`}>
        {!lessNumbersMode && (
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
        )}
        {lessNumbersMode && (
          <span className="progress-label">
            {percentageConsumed >= 100 ? 'Goal Reached' : "Today's Calories"}
          </span>
        )}
        <div className={`progress-bar ${lessNumbersMode ? 'progress-bar-large' : ''}`}>
          <div
            className={`progress-fill ${lessNumbersMode && percentageConsumed >= 100 ? 'progress-fill-solid' : ''}`}
            style={{
              width: `${Math.min(percentageConsumed, 100)}%`,
              '--progress': Math.min(percentageConsumed, 100) / 100
            }}
          ></div>
        </div>
      </div>

      {/* Add Entry Form */}
      <div className="card">
        {editingEntryId && <h2 className="form-title">Edit Entry</h2>}
        <form onSubmit={handleAddEntry}>
          {/* Mode toggle + main input row */}
          <div className="entry-mode-row">
            {isCustomMode ? (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Entry name"
                disabled={entryLoading}
                className="input entry-mode-input"
              />
            ) : (
              selectedFood ? (
                <div className="selected-food-summary">
                  <div className="selected-food-info">
                    <span className="selected-food-name">{selectedFood.name}</span>
                    {!lessNumbersMode && (
                      <span className="selected-food-calories">{getFoodCalorieLabel(selectedFood)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={() => setSelectedFoodId('')}
                    disabled={entryLoading}
                    aria-label="Clear food selection"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="food-picker-trigger"
                  onClick={() => setIsPickerOpen(true)}
                  disabled={entryLoading}
                >
                  Choose food
                </button>
              )
            )}

            <button
              type="button"
              className="mode-toggle-btn"
              onClick={isCustomMode ? handleSwitchToFoodMode : handleSwitchToCustomMode}
              disabled={entryLoading}
            >
              {isCustomMode ? 'Food' : 'Custom'}
            </button>
          </div>

          {isCustomMode ? (
            <>
              <div className="grams-quick-add">
                <button
                  type="button"
                  className="quick-add-btn"
                  onClick={() => setCustomCalories(String((parseFloat(customCalories) || 0) + 100))}
                  disabled={entryLoading}
                >
                  +100
                </button>
                <button
                  type="button"
                  className="quick-add-btn"
                  onClick={() => setCustomCalories(String((parseFloat(customCalories) || 0) + 50))}
                  disabled={entryLoading}
                >
                  +50
                </button>
                <button
                  type="button"
                  className="quick-add-btn"
                  onClick={() => setCustomCalories(String((parseFloat(customCalories) || 0) + 10))}
                  disabled={entryLoading}
                >
                  +10
                </button>
                <button
                  type="button"
                  className="quick-add-btn quick-add-btn-clear"
                  onClick={() => setCustomCalories('')}
                  disabled={entryLoading || !customCalories}
                >
                  Clear
                </button>
              </div>
              <input
                type="number"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                placeholder="Calories"
                disabled={entryLoading}
                className="input"
              />
            </>
          ) : (
            <>
              {/* Food-based entry: quantity input (grams or items based on food mode) */}
              {selectedFood && getFoodCalorieMode(selectedFood) === 'perItem' ? (
                <>
                  {/* Item mode: quick-add buttons for items */}
                  <div className="grams-quick-add">
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => setQuantity(String((parseFloat(quantity) || 0) + 5))}
                      disabled={entryLoading || !selectedFoodId}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => setQuantity(String((parseFloat(quantity) || 0) + 1))}
                      disabled={entryLoading || !selectedFoodId}
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => setQuantity(String((parseFloat(quantity) || 0) + 0.5))}
                      disabled={entryLoading || !selectedFoodId}
                    >
                      +0.5
                    </button>
                    <button
                      type="button"
                      className="quick-add-btn quick-add-btn-clear"
                      onClick={() => setQuantity('')}
                      disabled={entryLoading || !quantity}
                    >
                      Clear
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Number of items"
                    disabled={entryLoading || !selectedFoodId}
                    className="input"
                  />
                </>
              ) : (
                <>
                  {/* Gram mode: quick-add buttons for grams */}
                  <div className="grams-quick-add">
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => setGrams(String((parseFloat(grams) || 0) + 100))}
                      disabled={entryLoading || !selectedFoodId}
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => setGrams(String((parseFloat(grams) || 0) + 50))}
                      disabled={entryLoading || !selectedFoodId}
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      className="quick-add-btn"
                      onClick={() => setGrams(String((parseFloat(grams) || 0) + 10))}
                      disabled={entryLoading || !selectedFoodId}
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
                    disabled={entryLoading || !selectedFoodId}
                    className="input"
                  />
                </>
              )}

              {calculatedCalories > 0 && !lessNumbersMode && (
                <div className="calculated-calories">
                  <span className="calories-label">Calories:</span>
                  <span className="calories-value">{calculatedCalories} cal</span>
                </div>
              )}
            </>
          )}

          {entryError && (
            <div className="error">
              <p>{entryError}</p>
            </div>
          )}

          <div className="btn-group">
            {editingEntryId && (
              <button
                type="button"
                onClick={handleCancelEditEntry}
                className="btn btn-outline"
                disabled={entryLoading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="btn btn-primary btn-block"
            >
              {entryLoading ? (editingEntryId ? 'Updating...' : 'Adding...') : (editingEntryId ? 'Update' : 'Add Entry')}
            </button>
          </div>
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
                  {entry.quantityUnit === 'item' ? (
                    <span className="entry-grams"> ({entry.quantity} {entry.quantity === 1 ? 'item' : 'items'})</span>
                  ) : entry.grams ? (
                    <span className="entry-grams"> ({entry.grams}g)</span>
                  ) : null}
                </span>
                <div className="entry-details">
                  <div className="entry-meta">
                    {!lessNumbersMode && (
                      <span className="entry-calories">{entry.calories} cal</span>
                    )}
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
                      className="btn btn-icon"
                      aria-label="Edit entry"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="btn btn-icon"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={16} />
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
        onUSDASelect={handleUSDASelect}
        lessNumbersMode={lessNumbersMode}
      />

      <USDAImportModal
        isOpen={usdaImportFood !== null}
        usdaFood={usdaImportFood}
        onClose={handleUSDAImportClose}
        onImport={handleUSDAImport}
        existingFood={existingUSDAFood}
        importLoading={usdaImportLoading}
      />
    </>
  )
}

export default TodayView
