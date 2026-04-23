const layout = `
/* HEADER */
.header {
  padding: 52px 24px 20px;
  background: var(--cream);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.logo {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.5px;
}

.logo span {
  color: var(--accent);
  font-style: italic;
}

.avatar-pair {
  display: flex;
  gap: 4px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: white;
  border: 2px solid var(--cream);
}

.avatar-a { background: var(--accent); margin-right: -8px; }
.avatar-b { background: var(--accent2); }

/* TABS */
.tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab.active {
  background: var(--ink);
  border-color: var(--ink);
  color: white;
  font-weight: 500;
}

/* CONTENT */
.content {
  padding: 16px 24px 100px;
  animation: fadeUp 0.3s ease;
}

/* SECTION TITLE */
.section-title {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 300;
  color: var(--ink);
  margin-bottom: 4px;
  line-height: 1.1;
}

.section-title em {
  font-style: italic;
  color: var(--accent);
}

.section-sub {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 20px;
}
`

export default layout
