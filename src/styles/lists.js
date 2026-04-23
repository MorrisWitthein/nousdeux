const lists = `
/* RECIPES */
.recipe-card {
  background: var(--card);
  border-radius: 16px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
}

.recipe-card:hover { transform: translateY(-1px); }

.recipe-img {
  height: 120px;
  background: var(--warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
}

.recipe-img-label {
  position: absolute;
  bottom: 8px; left: 8px;
  background: var(--ink);
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 100px;
  font-weight: 500;
}

.recipe-body {
  padding: 14px;
}

.recipe-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 100px;
  background: var(--warm);
  color: var(--muted);
}

/* LISTS (series) */
.list-item {
  background: var(--card);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}

.list-item:hover { transform: translateX(3px); }

.list-emoji {
  font-size: 28px;
  width: 44px;
  height: 44px;
  background: var(--warm);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-info { flex: 1; }
.list-title {
  font-family: 'Fraunces', serif;
  font-size: 15px;
  color: var(--ink);
  margin-bottom: 2px;
}
.list-sub { font-size: 12px; color: var(--muted); }

.progress-bar {
  height: 3px;
  background: var(--warm);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent2);
  transition: width 0.5s ease;
}
`

export default lists
