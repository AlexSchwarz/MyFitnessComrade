function Navigation({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'calories', label: 'Calories', icon: '🔥' },
    { id: 'foods', label: 'Foods', icon: '🍎' },
    { id: 'weight', label: 'Weight', icon: '⚖️' },
    { id: 'account', label: 'Account', icon: '👤' },
  ]

  return (
    <nav className="navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${currentTab === tab.id ? 'nav-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default Navigation
