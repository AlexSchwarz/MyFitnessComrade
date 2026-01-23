import { useState, useEffect } from 'react'
import { Download, AlertCircle, CheckCircle } from 'lucide-react'
import { getUSDAFoodDetails } from '../services/usda'

function USDAImportModal({
  isOpen,
  usdaFood,
  onClose,
  onImport,
  existingFood,
  importLoading
}) {
  const [foodDetails, setFoodDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Manual calories input (for when auto-detection fails)
  const [manualCalories, setManualCalories] = useState('')

  // Fetch food details when modal opens with a new food
  useEffect(() => {
    if (!isOpen || !usdaFood) {
      setFoodDetails(null)
      setError(null)
      setManualCalories('')
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const details = await getUSDAFoodDetails(usdaFood.fdcId)
        setFoodDetails(details)

        // Pre-fill manual calories if available
        if (details.caloriesPer100g) {
          setManualCalories(details.caloriesPer100g.toString())
        } else {
          setManualCalories('')
        }
      } catch (err) {
        setError(err.message)
        setFoodDetails(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, usdaFood?.fdcId])

  const handleImport = () => {
    const caloriesNum = parseFloat(manualCalories)
    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      setError('Please enter valid calories per 100g')
      return
    }

    onImport({
      fdcId: usdaFood.fdcId,
      name: foodDetails?.description || usdaFood.description,
      caloriesPer100g: caloriesNum,
      dataType: foodDetails?.dataType || usdaFood.dataType,
      brandOwner: foodDetails?.brandOwner || usdaFood.brandOwner,
    })
  }

  const handleUseExisting = () => {
    onClose(existingFood)
  }

  if (!isOpen) return null

  const showDuplicateWarning = existingFood !== null

  return (
    <div className="usda-import-overlay" onClick={onClose}>
      <div className="usda-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="usda-import-header">
          <h2>Import Food</h2>
          <button
            className="usda-import-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="usda-import-content">
          {loading && (
            <div className="usda-import-loading">
              <p>Loading food details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="usda-import-error">
              <AlertCircle size={20} />
              <p>{error}</p>
              <button className="button button-secondary" onClick={onClose}>
                Go Back
              </button>
            </div>
          )}

          {!loading && !error && foodDetails && (
            <>
              {showDuplicateWarning && (
                <div className="usda-import-duplicate">
                  <CheckCircle size={20} />
                  <div>
                    <p><strong>Already imported!</strong></p>
                    <p>This food is already in your library as "{existingFood.name}"</p>
                  </div>
                </div>
              )}

              <div className="usda-import-details">
                <div className="usda-import-field">
                  <label>Name</label>
                  <p className="usda-import-value">{foodDetails.description}</p>
                </div>

                <div className="usda-import-field">
                  <label>Data Type</label>
                  <p className="usda-import-value usda-import-meta">
                    {foodDetails.dataType}
                    {foodDetails.brandOwner && ` • ${foodDetails.brandOwner}`}
                  </p>
                </div>

                <div className="usda-import-field">
                  <label htmlFor="calories-input">
                    Calories per 100g
                    {!foodDetails.hasCalorieData && (
                      <span className="required-indicator"> (required)</span>
                    )}
                  </label>
                  <input
                    id="calories-input"
                    type="number"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    placeholder="Enter calories per 100g"
                    className="input"
                    min="0"
                    step="1"
                  />
                  {!foodDetails.hasCalorieData && (
                    <p className="usda-import-hint">
                      Calorie data could not be automatically determined. Please enter manually.
                    </p>
                  )}
                </div>
              </div>

              <div className="usda-import-actions">
                {showDuplicateWarning ? (
                  <>
                    <button
                      className="button button-primary"
                      onClick={handleUseExisting}
                    >
                      <CheckCircle size={18} />
                      Use Existing
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="button button-primary"
                      onClick={handleImport}
                      disabled={importLoading || !manualCalories}
                    >
                      <Download size={18} />
                      {importLoading ? 'Importing...' : 'Import'}
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={onClose}
                      disabled={importLoading}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default USDAImportModal
