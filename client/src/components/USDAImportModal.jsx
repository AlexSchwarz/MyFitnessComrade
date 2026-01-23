import { useState, useEffect } from 'react'
import { Download, AlertCircle, CheckCircle } from 'lucide-react'

function USDAImportModal({
  isOpen,
  usdaFood,
  onClose,
  onImport,
  existingFood,
  importLoading
}) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !usdaFood) {
      setName('')
      setCalories('')
      setError(null)
      return
    }

    setName(usdaFood.description || '')

    if (usdaFood.caloriesPer100g !== null && usdaFood.caloriesPer100g !== undefined) {
      setCalories(usdaFood.caloriesPer100g.toString())
    } else {
      setCalories('')
    }
  }, [isOpen, usdaFood?.fdcId])

  const handleImport = () => {
    if (!name.trim()) {
      setError('Please enter a name')
      return
    }

    const caloriesNum = parseFloat(calories)
    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      setError('Please enter valid calories')
      return
    }

    setError(null)
    onImport({
      fdcId: usdaFood.fdcId,
      name: name.trim(),
      caloriesPer100g: caloriesNum,
      dataType: usdaFood.dataType,
      brandOwner: usdaFood.brandOwner,
    })
  }

  const handleUseExisting = () => {
    onClose(existingFood)
  }

  if (!isOpen || !usdaFood) return null

  const showDuplicateWarning = existingFood !== null
  const hasCalorieData = usdaFood.caloriesPer100g !== null && usdaFood.caloriesPer100g !== undefined

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Food</h2>
          <button
            className="modal-close"
            onClick={() => onClose()}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {showDuplicateWarning && (
            <div className="notice notice-info">
              <CheckCircle size={18} />
              <div>
                <strong>Already in your library</strong>
                <span>Saved as "{existingFood.name}"</span>
              </div>
            </div>
          )}

          {error && (
            <div className="notice notice-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="import-name">Name</label>
            <input
              id="import-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Food name"
              className="input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="import-calories">
              Calories per 100g
              {!hasCalorieData && <span className="label-hint"> (required)</span>}
            </label>
            <input
              id="import-calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 120"
              className="input"
              min="0"
              step="1"
            />
            {!hasCalorieData && (
              <span className="form-hint">Not available from USDA</span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {showDuplicateWarning ? (
            <>
              <button
                type="button"
                className="btn-text"
                onClick={() => onClose()}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUseExisting}
              >
                Use Existing
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-text"
                onClick={() => onClose()}
                disabled={importLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={importLoading || !name.trim() || !calories}
              >
                <Download size={16} />
                {importLoading ? 'Importing...' : 'Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default USDAImportModal
