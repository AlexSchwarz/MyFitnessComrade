import { Flame, Apple, Scale, User, Clipboard } from "lucide-react";

function Navigation({ currentTab, onTabChange }) {
  const tabs = [
    { id: "calories", label: "Calories", Icon: Flame },
    { id: "foods", label: "Foods", Icon: Apple },
    { id: "weight", label: "Weight", Icon: Clipboard },
    { id: "account", label: "Account", Icon: User },
  ];

  return (
    <nav className="navigation">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-tab ${currentTab === id ? "nav-tab-active" : ""}`}
          onClick={(e) => {
            e.currentTarget.blur();
            onTabChange(id);
          }}
        >
          <Icon className="nav-icon" aria-hidden="true" />
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navigation;
