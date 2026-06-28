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
  color: var(--on-ink);
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

/* Media card (movies/series) — full-height portrait poster on the left,
   content column on the right. Poster is flush to the card edge and clipped
   by the card's rounded corners. */
.media-card {
  display: flex;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 10px;
  min-height: 150px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.media-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.media-poster {
  width: 100px;
  flex-shrink: 0;
  align-self: stretch;
  object-fit: cover;
  background: var(--warm);
  display: block;
}

/* Emoji fallback occupies the same poster slot when no image is set. */
.media-poster-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
}

.media-body {
  flex: 1;
  min-width: 0;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-body-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

/* Meta area for media cards — platform first (where to watch), then
   genre/season chips (what it is). Color-coded so the two read distinctly. */
.media-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* Platform — prominent teal "where to watch" chip with a streaming glyph. */
.chip-platform {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px 3px 7px;
  border-radius: 100px;
  background: var(--badge-green-bg);
  color: var(--accent2);
  white-space: nowrap;
}
.chip-platform svg { opacity: 0.85; }

/* Genre / season — lighter neutral chips. */
.chip-genre {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 100px;
  background: var(--warm);
  color: var(--muted);
  border: 1px solid var(--border);
  white-space: nowrap;
}

/* Gold star rating on watched-movie cards. */
.media-rating {
  font-size: 14px;
  line-height: 1;
  letter-spacing: 1px;
}
.stars-display { color: var(--accent3); }

.media-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* Subsection label inside a list (e.g. "Läuft" / "Geplant" for series). */
.list-section-head {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 18px 2px 8px;
}
.list-section-head:first-child { margin-top: 0; }

/* Season progress on running-series cards: "Staffel 2 / 5" + a thin bar. */
.season-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.season-progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
}
.season-progress-pct {
  color: var(--accent2);
  font-weight: 600;
}
.season-bar {
  height: 5px;
  border-radius: 100px;
  background: var(--warm);
  overflow: hidden;
}
.season-bar-fill {
  height: 100%;
  background: var(--accent2);
  border-radius: 100px;
  transition: width 0.3s ease;
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

/* POSTER + TMDB PICKER (create/edit forms) */
.poster-picker-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.poster-picker-preview {
  width: 80px;
  height: 120px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.poster-picker-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: var(--warm);
  border: 1px solid var(--border);
}

.poster-picker-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poster-picker-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--muted);
}

/* Title field that drives the TMDB autocomplete; anchors the dropdown. */
.title-search {
  position: relative;
}

/* Scrollable list of TMDB matches the user picks from. */
.tmdb-results {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
}

/* As an autocomplete dropdown the list floats over the form below the input
   instead of pushing the fields down. */
.title-search-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 5;
  margin: 0;
  background: var(--cream);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.tmdb-results li + li {
  border-top: 1px solid var(--border);
}

.tmdb-result {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.tmdb-result:hover { background: var(--warm); }
.tmdb-result:disabled { opacity: 0.6; cursor: default; }

.tmdb-result img,
.tmdb-result-noimg {
  width: 36px;
  height: 54px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.tmdb-result-noimg {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--warm);
}

.tmdb-result-title {
  font-size: 14px;
  color: var(--ink);
}

.tmdb-result-year { color: var(--muted); }

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
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
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
