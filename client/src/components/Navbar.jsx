import React, { useState } from 'react';
import {
  FolderGit2,
  FileText,
  BookOpen,
  LayoutDashboard,
  Sun,
  Moon,
  Search,
  Menu,
  X
} from 'lucide-react';
import { GyaniLogo } from './GyaniLogo';

export function Navbar({ activeTab, setActiveTab, theme, toggleTheme, onOpenSearch }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Index', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'notes', label: 'Notes & Files', icon: FileText },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar" aria-label="Main Navigation">
        {/* Gyani Brand Masthead */}
        <GyaniLogo
          size={32}
          showSubtext={true}
          onClick={() => setActiveTab('overview')}
        />

        {/* Desktop Nav Links */}
        <div className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Search, Theme Toggle, Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="paper-btn paper-btn-sm"
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}
            title="Search archive (Ctrl+K)"
          >
            <Search size={13} />
            <span className="search-label-desktop">
              Search
            </span>
            <kbd className="search-kbd-shortcut">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle Button (Paper vs E-Ink Slate) */}
          <button
            onClick={toggleTheme}
            className="paper-btn paper-btn-icon"
            aria-label={`Switch to ${theme === 'dark' ? 'paper' : 'slate'} mode`}
            title={`Mode: ${theme === 'dark' ? 'E-Ink Slate' : 'Warm Paper'}`}
          >
            {theme === 'dark' ? (
              <Sun size={15} color="var(--text-primary)" />
            ) : (
              <Moon size={15} color="var(--text-primary)" />
            )}
          </button>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="paper-btn paper-btn-icon mobile-nav-toggle"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="paper-panel mobile-nav-dropdown">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
