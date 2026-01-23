import { Pencil, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'

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
  const { theme } = useTheme()

  // Theme-aware colors for charts
  const colors = {
    grid: theme === 'dark' ? '#333' : '#e0e0e0',
    axis: theme === 'dark' ? '#888' : '#666',
    tooltipBg: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#333' : '#e0e0e0',
    tooltipText: theme === 'dark' ? '#fff' : '#1a1a1a',
    tooltipLabel: theme === 'dark' ? '#888' : '#666',
    accent: theme === 'dark' ? '#4ade80' : '#3b82f6',
  };

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

  // Calculate Y-axis domain with 2 kg padding, aligned to 2 kg intervals
  const weights = chartData.map(d => d.weight)
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100
  const yMin = Math.floor((minWeight - 2) / 2) * 2
  const yMax = Math.ceil((maxWeight + 2) / 2) * 2

  // Generate tick values at 2 kg intervals
  const yTicks = []
  for (let tick = yMin; tick <= yMax; tick += 2) {
    yTicks.push(tick)
  }

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
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="date"
                  stroke={colors.axis}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={colors.axis}
                  fontSize={12}
                  tickLine={false}
                  domain={[yMin, yMax]}
                  ticks={yTicks}
                  interval={0}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: '4px',
                    color: colors.tooltipText
                  }}
                  labelStyle={{ color: colors.tooltipLabel }}
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
                  stroke={colors.accent}
                  strokeWidth={2}
                  dot={{ fill: colors.accent, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: colors.accent }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Log Weight Entry Form */}
      <div className="card">
        <h2 className="form-title">{editingWeightId ? 'Edit Weight Entry' : ''}</h2>
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
        {weightEntries.length === 0 ? (
          <div className="empty-state">
            <p>No entries logged yet</p>
            <p className="empty-state-hint">Add your first weight entry above!</p>
          </div>
        ) : (
          <div className="entries-list">
            {weightEntries.map(entry => (
              <div key={entry.id} className="entry-card">
                <span className="entry-name">{entry.weight} kg</span>
                <div className="entry-details">
                  <div className="entry-meta">
                    <span className="entry-time">
                      {new Date(entry.entryTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })} at {new Date(entry.entryTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="entry-actions">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default WeightView
