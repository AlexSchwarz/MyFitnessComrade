import { Pencil, Trash2 } from 'lucide-react'

function FoodsView({
  foods,
  showFoodForm,
  foodFormName,
  setFoodFormName,
  foodFormCalories,
  setFoodFormCalories,
  foodError,
  foodLoading,
  editingFoodId,
  handleShowFoodForm,
  handleEditFood,
  handleCancelFoodForm,
  handleSaveFood,
  handleDeleteFood,
}) {
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
            <input
              type="number"
              step="0.1"
              value={foodFormCalories}
              onChange={(e) => setFoodFormCalories(e.target.value)}
              placeholder="Calories per 100g"
              disabled={foodLoading}
              className="input"
            />

            {foodError && (
              <div className="error">
                <p>{foodError}</p>
              </div>
            )}

            <div className="button-group">
              <button type="submit" disabled={foodLoading} className="button">
                {foodLoading ? 'Saving...' : editingFoodId ? 'Update Food' : 'Add Food'}
              </button>
              <button
                type="button"
                onClick={handleCancelFoodForm}
                className="button-small"
                disabled={foodLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Foods List */}
      <div className="card">
        <div className="card-header-row">
          <h2>My Foods</h2>
          {!showFoodForm && (
            <button onClick={handleShowFoodForm} className="button-add">
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
                  <span className="food-calories">{food.caloriesPer100g} cal/100g</span>
                  <div className="food-actions">
                    <button
                      onClick={() => handleEditFood(food)}
                      className="button-icon button-icon-edit"
                      aria-label="Edit food"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      className="button-icon button-icon-delete"
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
    </>
  )
}

export default FoodsView
