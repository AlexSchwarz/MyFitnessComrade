import { Pencil, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function WeightView({
  weightEntries,
  weightFormValue,
  setWeightFormValue,
  weightFormDateTime,
  setWeightFormDateTime,
  weightError,
  weightLoading,
  editingWeightId,
  handleAddWeight,
  handleEditWeight,
  handleCancelEditWeight,
  handleDeleteWeight,
}) {
  // Prepare chart data - last 30 days, chronological order
  const chartData = [...weightEntries]
    .sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime))
    .map(entry => {
      const entryDate = new Date(entry.entryTime)
      return {
        date: entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: entryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        weight: entry.weight,
      }
    })

  const isSubmitDisabled = weightLoading || !weightFormValue || parseFloat(weightFormValue) <= 0

  return (
    <>
      {/* Weight Chart */}
      <div className="card">
        <h2 className="card-title">Last 30 Days</h2>
        {chartData.length === 0 ? (
          <div className="empty-state">
            <p>No weight entries yet</p>
            <p className="empty-state-hint">Add your first entry below to see your progress!</p>
          </div>
        ) : (
          <div className="weight-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#888' }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${label} at ${payload[0].payload.time}`
                    }
                    return label
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ fill: '#4ade80', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#4ade80' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Log Weight Entry Form */}
      <div className="card">
        <h2 className="form-title">{editingWeightId ? 'Edit Weight Entry' : 'Log Weight Entry'}</h2>
        <form onSubmit={handleAddWeight}>
          <input
            type="number"
            step="0.1"
            value={weightFormValue}
            onChange={(e) => setWeightFormValue(e.target.value)}
            placeholder="Weight (kg)"
            disabled={weightLoading}
            className="input"
          />

          <input
            type="datetime-local"
            value={weightFormDateTime}
            onChange={(e) => setWeightFormDateTime(e.target.value)}
            disabled={weightLoading}
            className="input"
          />

          {weightError && (
            <div className="error">
              <p>{weightError}</p>
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="button"
            >
              {weightLoading
                ? (editingWeightId ? 'Updating...' : 'Adding...')
                : (editingWeightId ? 'Update Entry' : 'Add Entry')
              }
            </button>
            {editingWeightId && (
              <button
                type="button"
                onClick={handleCancelEditWeight}
                className="button-secondary"
                disabled={weightLoading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Weight Log */}
      <div className="card">
        <h2 className="card-title">Weight Log</h2>
        {weightEntries.length === 0 ? (
          <div className="empty-state">
            <p>No entries logged yet</p>
            <p className="empty-state-hint">Add your first weight entry above!</p>
          </div>
        ) : (
          <div className="weight-entries-list">
            {weightEntries.map(entry => (
              <div key={entry.id} className="weight-entry-card">
                <div className="weight-entry-info">
                  <span className="weight-entry-value">{entry.weight} kg</span>
                  <span className="weight-entry-time">
                    {new Date(entry.entryTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })} at {new Date(entry.entryTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="weight-entry-actions">
                  <button
                    onClick={() => handleEditWeight(entry)}
                    className="button-icon"
                    aria-label="Edit entry"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteWeight(entry.id)}
                    className="button-icon"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default WeightView
