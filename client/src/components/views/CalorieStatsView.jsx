import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Trash2 } from 'lucide-react'

function CalorieStatsView({
  dailySummaries,
  dailyGoal,
  streak,
  selectedDays,
  onDaysChange,
  loading,
  onDeleteDayEntries,
}) {
  const threshold = dailyGoal * 1.05;

  // Filter to selected range and format for chart
  const chartData = dailySummaries
    .slice(-selectedDays)
    .map(day => ({
      ...day,
      displayDate: new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));

  // Only show loading on initial load (no data yet), not on refreshes
  if (loading && dailySummaries.length === 0) {
    return <div className="card"><p>Loading stats...</p></div>;
  }

  return (
    <>
      {/* Streak Card */}
      <div className="card streak-card">
        <div className="streak-display">
          <span className="streak-count">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
        <p className="streak-hint">
          Consecutive days at or below {Math.round(threshold)} cal (goal + 5%)
        </p>
      </div>

      {/* Day Selector */}
      <div className="card">
        <div className="days-selector">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              type="button"
              className={`days-btn ${selectedDays === days ? 'days-btn-active' : ''}`}
              onClick={() => onDaysChange(days)}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="card-title">Daily Calories</h2>
        {chartData.every(d => d.totalCalories === 0) ? (
          <div className="empty-state">
            <p>No calorie data yet</p>
            <p className="empty-state-hint">Start logging entries to see your history!</p>
          </div>
        ) : (
          <div className="calorie-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="displayDate" stroke="#888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} />
                <ReferenceLine y={threshold} stroke="#888" strokeDasharray="5 5" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value} cal`, 'Calories']}
                />
                <Bar dataKey="totalCalories" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.totalCalories > threshold ? '#ef4444' : '#4ade80'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily Totals List */}
      <div className="card">
        <h2 className="card-title">Daily Totals</h2>
        {chartData.filter(d => d.entryCount > 0).length === 0 ? (
          <div className="empty-state">
            <p>No data to display</p>
          </div>
        ) : (
          <div className="entries-list">
            {[...chartData]
              .filter(day => day.entryCount > 0)
              .reverse()
              .map(day => {
                const isOverGoal = day.totalCalories > threshold;
                const isUnderGoal = day.totalCalories <= threshold;
                return (
                  <div key={day.date} className="entry-card">
                    <span className="entry-name">{day.displayDate}</span>
                    <div className="entry-details">
                      <div className="entry-meta">
                        <span className={`entry-calories ${isOverGoal ? 'over-goal' : isUnderGoal ? 'under-goal' : ''}`}>
                          {day.totalCalories} cal
                        </span>
                        <span className="entry-time">
                          {day.entryCount} {day.entryCount === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <div className="entry-actions">
                        <button
                          onClick={() => onDeleteDayEntries(day.date)}
                          className="button-icon"
                          aria-label="Delete all entries for this day"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}

export default CalorieStatsView;
