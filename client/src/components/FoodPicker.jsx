import { useState, useMemo } from 'react'

function FoodPicker({ foods, isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) {
      return foods
    }
    const query = searchQuery.toLowerCase()
    return foods.filter(food =>
      food.name.toLowerCase().includes(query)
    )
  }, [foods, searchQuery])

  const handleSelect = (food) => {
    onSelect(food)
    setSearchQuery('')
    onClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="food-picker-overlay" onClick={handleClose}>
      <div className="food-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="food-picker-header">
          <h2>Choose Food</h2>
          <button
            className="food-picker-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="food-picker-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            className="input"
            autoFocus
          />
        </div>

        <div className="food-picker-list">
          {filteredFoods.length === 0 ? (
            <div className="food-picker-empty">
              <p>No matches</p>
            </div>
          ) : (
            filteredFoods.map(food => (
              <button
                key={food.id}
                className="food-picker-item"
                onClick={() => handleSelect(food)}
              >
                <span className="food-picker-item-name">{food.name}</span>
                <span className="food-picker-item-calories">{food.caloriesPer100g} cal/100g</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodPicker
