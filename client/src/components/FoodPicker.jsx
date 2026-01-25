import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Database, User } from 'lucide-react'
import { searchUSDAFoods } from '../services/usda'
import { getFoodCalorieLabel } from '../services/foods'

// Debounce delay for USDA search
const USDA_DEBOUNCE_MS = 400

function FoodPicker({ foods, isOpen, onClose, onSelect, onUSDASelect, defaultSource = 'my-foods', usdaOnly = false, lessNumbersMode = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [source, setSource] = useState(defaultSource) // 'my-foods' or 'usda'

  // Reset source when picker opens
  useEffect(() => {
    if (isOpen) {
      setSource(usdaOnly ? 'usda' : defaultSource)
    }
  }, [isOpen, defaultSource, usdaOnly])

  // USDA search state
  const [usdaResults, setUsdaResults] = useState([])
  const [usdaLoading, setUsdaLoading] = useState(false)
  const [usdaError, setUsdaError] = useState(null)
  const [usdaTotalHits, setUsdaTotalHits] = useState(0)
  const [usdaCurrentPage, setUsdaCurrentPage] = useState(1)
  const [usdaTotalPages, setUsdaTotalPages] = useState(0)

  // Filter local foods based on search
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) {
      return foods
    }
    const query = searchQuery.toLowerCase()
    return foods.filter(food =>
      food.name.toLowerCase().includes(query)
    )
  }, [foods, searchQuery])

  // Debounced USDA search
  useEffect(() => {
    if (source !== 'usda') return
    if (searchQuery.length < 2) {
      setUsdaResults([])
      setUsdaError(null)
      setUsdaTotalHits(0)
      setUsdaCurrentPage(1)
      setUsdaTotalPages(0)
      return
    }

    const timeoutId = setTimeout(async () => {
      setUsdaLoading(true)
      setUsdaError(null)

      try {
        const result = await searchUSDAFoods(searchQuery, 25, 1)
        setUsdaResults(result.foods)
        setUsdaTotalHits(result.totalHits)
        setUsdaCurrentPage(result.currentPage)
        setUsdaTotalPages(result.totalPages)
      } catch (error) {
        setUsdaError(error.message)
        setUsdaResults([])
      } finally {
        setUsdaLoading(false)
      }
    }, USDA_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, source])

  // Load more USDA results
  const handleLoadMore = useCallback(async () => {
    if (usdaLoading || usdaCurrentPage >= usdaTotalPages) return

    setUsdaLoading(true)
    setUsdaError(null)

    try {
      const result = await searchUSDAFoods(searchQuery, 25, usdaCurrentPage + 1)
      setUsdaResults(prev => [...prev, ...result.foods])
      setUsdaCurrentPage(result.currentPage)
    } catch (error) {
      setUsdaError(error.message)
    } finally {
      setUsdaLoading(false)
    }
  }, [searchQuery, usdaCurrentPage, usdaTotalPages, usdaLoading])

  const handleSelect = (food) => {
    onSelect(food)
    resetAndClose()
  }

  const handleUSDASelect = (usdaFood) => {
    if (onUSDASelect) {
      onUSDASelect(usdaFood)
    }
    // Don't close - let the import modal handle that
  }

  const resetAndClose = () => {
    setSearchQuery('')
    setSource('my-foods')
    setUsdaResults([])
    setUsdaError(null)
    setUsdaTotalHits(0)
    setUsdaCurrentPage(1)
    setUsdaTotalPages(0)
    onClose()
  }

  const handleSourceChange = (newSource) => {
    setSource(newSource)
    setSearchQuery('')
    setUsdaResults([])
    setUsdaError(null)
  }

  if (!isOpen) return null

  return (
    <div className="food-picker-overlay" onClick={resetAndClose}>
      <div className="food-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="food-picker-header">
          <h2>{usdaOnly ? 'Search USDA Database' : 'Choose Food'}</h2>
          <button
            className="food-picker-close"
            onClick={resetAndClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Source Toggle - only show when not usdaOnly */}
        {!usdaOnly && (
          <div className="food-picker-source-toggle">
            <button
              className={`source-toggle-btn ${source === 'my-foods' ? 'active' : ''}`}
              onClick={() => handleSourceChange('my-foods')}
            >
              <User size={16} />
              <span>My Foods</span>
            </button>
            <button
              className={`source-toggle-btn ${source === 'usda' ? 'active' : ''}`}
              onClick={() => handleSourceChange('usda')}
            >
              <Database size={16} />
              <span>USDA Database</span>
            </button>
          </div>
        )}

        <div className="food-picker-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={source === 'usda' ? 'Search USDA foods (min 2 chars)...' : 'Search your foods...'}
            className="input"
            autoFocus
          />
        </div>

        <div className="food-picker-list">
          {source === 'my-foods' ? (
            // My Foods list
            filteredFoods.length === 0 ? (
              <div className="food-picker-empty">
                <p>{searchQuery ? 'No matches' : 'No foods in your library'}</p>
              </div>
            ) : (
              filteredFoods.map(food => (
                <button
                  key={food.id}
                  className="food-picker-item"
                  onClick={() => handleSelect(food)}
                >
                  <span className="food-picker-item-name">{food.name}</span>
                  {!lessNumbersMode && (
                    <span className="food-picker-item-calories">{getFoodCalorieLabel(food)}</span>
                  )}
                </button>
              ))
            )
          ) : (
            // USDA search results
            <>
              {usdaError && (
                <div className="food-picker-error">
                  <p>{usdaError}</p>
                </div>
              )}

              {searchQuery.length < 2 && !usdaLoading && (
                <div className="food-picker-empty">
                  <p>Type at least 2 characters to search</p>
                </div>
              )}

              {searchQuery.length >= 2 && !usdaLoading && usdaResults.length === 0 && !usdaError && (
                <div className="food-picker-empty">
                  <p>No results found</p>
                </div>
              )}

              {usdaResults.map(food => (
                <button
                  key={food.fdcId}
                  className="food-picker-item usda-item"
                  onClick={() => handleUSDASelect(food)}
                >
                  <div className="food-picker-item-main">
                    <span className="food-picker-item-name">{food.description}</span>
                    <span className="food-picker-item-meta">
                      {!lessNumbersMode && (food.caloriesPer100g !== null ? `${food.caloriesPer100g} cal/100g` : 'No calorie data')}
                      {!lessNumbersMode && food.brandOwner && ' • '}
                      {food.brandOwner && food.brandOwner}
                    </span>
                  </div>
                </button>
              ))}

              {usdaLoading && (
                <div className="food-picker-loading">
                  <p>Searching...</p>
                </div>
              )}

              {!usdaLoading && usdaResults.length > 0 && usdaCurrentPage < usdaTotalPages && (
                <button
                  className="food-picker-load-more"
                  onClick={handleLoadMore}
                >
                  Load more ({usdaTotalHits - usdaResults.length} remaining)
                </button>
              )}

              {usdaTotalHits > 0 && (
                <div className="food-picker-results-count">
                  Showing {usdaResults.length} of {usdaTotalHits} results
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodPicker
