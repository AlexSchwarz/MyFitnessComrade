import { useState } from 'react'
import { Pencil, Trash2, Database } from 'lucide-react'
import FoodPicker from '../FoodPicker'
import { useTheme } from '../../contexts/ThemeContext'
import { getFoodCalorieLabel } from '../../services/foods'

function FoodsView({
  foods,
  showFoodForm,
  foodFormName,
  setFoodFormName,
  foodFormCalories,
  setFoodFormCalories,
  foodFormCalorieMode,
  setFoodFormCalorieMode,
  foodFormCaloriesPerItem,
  setFoodFormCaloriesPerItem,
  foodError,
  foodLoading,
  editingFoodId,
  handleShowFoodForm,
  handleEditFood,
  handleCancelFoodForm,
  handleSaveFood,
  handleDeleteFood,
}) {
  const { lessNumbersMode } = useTheme()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleUSDASelect = (usdaFood) => {
    // Pre-fill form with USDA data
    setFoodFormName(usdaFood.description || '')
    if (usdaFood.caloriesPer100g !== null && usdaFood.caloriesPer100g !== undefined) {
      setFoodFormCalories(usdaFood.caloriesPer100g.toString())
    }
    setIsPickerOpen(false)
  }

  const handleOpenUSDASearch = () => {
    setIsPickerOpen(true)
  }

  return (
    <>
      {/* Add/Edit Food Form */}
      {showFoodForm && (
        <div className="card">
          <h2 className="form-title">{editingFoodId ? 'Edit Food' : 'Add Food'}</h2>
          <form onSubmit={handleSaveFood}>
            <input
              type="text"
              value={foodFormName}
              onChange={(e) => setFoodFormName(e.target.value)}
              placeholder="Food name (e.g., Chicken Breast)"
              disabled={foodLoading}
              className="input"
            />

            {/* Calorie Mode Selector */}
            <div className="calorie-mode-selector">
              <button
                type="button"
                className={`calorie-mode-btn ${foodFormCalorieMode === 'per100g' ? 'calorie-mode-btn-active' : ''}`}
                onClick={() => setFoodFormCalorieMode('per100g')}
                disabled={foodLoading}
              >
                Per 100g
              </button>
              <button
                type="button"
                className={`calorie-mode-btn ${foodFormCalorieMode === 'perItem' ? 'calorie-mode-btn-active' : ''}`}
                onClick={() => setFoodFormCalorieMode('perItem')}
                disabled={foodLoading}
              >
                Per item
              </button>
            </div>

            {/* Conditional calorie input based on mode */}
            {foodFormCalorieMode === 'perItem' ? (
              <input
                type="number"
                step="0.1"
                value={foodFormCaloriesPerItem}
                onChange={(e) => setFoodFormCaloriesPerItem(e.target.value)}
                placeholder="Calories per item"
                disabled={foodLoading}
                className="input"
              />
            ) : (
              <input
                type="number"
                step="0.1"
                value={foodFormCalories}
                onChange={(e) => setFoodFormCalories(e.target.value)}
                placeholder="Calories per 100g"
                disabled={foodLoading}
                className="input"
              />
            )}

            {foodError && (
              <div className="error">
                <p>{foodError}</p>
              </div>
            )}

            <div className="food-form-actions">
              {!editingFoodId && (
                <button
                  type="button"
                  onClick={handleOpenUSDASearch}
                  className="btn btn-secondary btn-sm"
                  disabled={foodLoading}
                >
                  <Database size={16} />
                  Import from USDA
                </button>
              )}
              <div className="food-form-buttons">
                <button
                  type="button"
                  onClick={handleCancelFoodForm}
                  className="btn btn-outline btn-sm"
                  disabled={foodLoading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={foodLoading} className="btn btn-primary btn-sm">
                  {foodLoading ? 'Saving...' : editingFoodId ? 'Update' : 'Add Food'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Foods List */}
      <div className="card">
        <div className="card-header-row">
          <h2>Registered Foods</h2>
          {!showFoodForm && (
            <button onClick={handleShowFoodForm} className="btn btn-primary btn-sm">
              + Add
            </button>
          )}
        </div>

        {foods.length === 0 ? (
          <div className="empty-state">
            <p>No foods yet</p>
            <p className="empty-state-hint">Add your first food to start tracking!</p>
          </div>
        ) : (
          <div className="foods-list">
            {foods.map(food => (
              <div key={food.id} className="food-card">
                <span className="food-name">{food.name}</span>
                <div className="food-details">
                  {!lessNumbersMode && (
                    <span className="food-calories">{getFoodCalorieLabel(food)}</span>
                  )}
                  <div className="food-actions">
                    <button
                      onClick={() => handleEditFood(food)}
                      className="btn btn-icon"
                      aria-label="Edit food"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      className="btn btn-icon"
                      aria-label="Delete food"
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
        foods={[]}
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={() => {}}
        onUSDASelect={handleUSDASelect}
        usdaOnly={true}
      />
    </>
  )
}

export default FoodsView
