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

/* LISTS (series / movies / activities) — share the .card shell from cards.js */
.list-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

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

/* Poster thumbnail (movies/series) — portrait 2:3, replaces .list-emoji */
.list-poster {
  width: 44px;
  height: 66px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--warm);
  flex-shrink: 0;
  display: block;
}

/* Poster in the detail sheet — centered, larger portrait */
.detail-poster {
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin: 0 auto 12px;
  display: block;
}

/* SHOPPING LIST */
.shopping-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
  margin-bottom: 16px;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 6px 6px 6px 16px;
  transition: border-color 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.shopping-input-row:focus-within {
  border-color: var(--ink);
}

.shopping-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: var(--ink);
  outline: none;
  padding: 6px 0;
  min-width: 0;
}

.shopping-input::placeholder { color: var(--muted); }

.shop-add-btn {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, transform 0.1s;
}

.shop-add-btn:hover { opacity: 0.85; }
.shop-add-btn:active { transform: scale(0.93); }

.shop-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--cream);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  z-index: 50;
  overflow: hidden;
}

.shop-suggestion-item {
  padding: 11px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: var(--ink);
  cursor: pointer;
}

.shop-suggestion-item:hover { background: var(--warm); }

.shop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.shop-item-checked { opacity: 0.55; }

.shop-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: none;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: border-color 0.15s, background 0.15s;
}

.shop-check:hover { border-color: var(--ink); }

.shop-check-done {
  background: var(--accent2);
  border-color: var(--accent2);
}

.shop-check-inner {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.shop-check-inner-done {
  color: white;
  font-size: 12px;
  line-height: 1;
  width: auto;
  height: auto;
  border-radius: 0;
}

.shop-item-name {
  flex: 1;
  font-size: 14px;
  color: var(--ink);
  font-family: 'DM Sans', sans-serif;
}

.shop-item-name-checked {
  text-decoration: line-through;
  color: var(--muted);
}

.shop-author-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.shop-divider {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 0 8px;
}
`

export default lists
