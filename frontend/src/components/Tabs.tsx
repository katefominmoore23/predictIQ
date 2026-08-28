import React, { useState } from 'react';
import './Tabs.css';

interface TabConfig {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: TabConfig[];
  children: React.ReactNode[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  children,
  defaultTab,
  onTabChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabConfig = tabs.find(t => t.id === activeTab);

  return (
    <div className={`tabs ${className}`}>
      <div className="tabs-header" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.icon && <span className="tab-icon" aria-hidden="true">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tabs-content">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
            hidden={activeTab !== tab.id}
          >
            {children[index]}
          </div>
        ))}
      </div>
    </div>
  );
};
