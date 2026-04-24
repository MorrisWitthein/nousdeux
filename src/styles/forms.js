const forms = `
.add-form {
  background: var(--card);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  animation: fadeUp 0.25s ease;
}

.add-form input, .add-form select, .add-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: var(--ink);
  background: var(--cream);
  margin-bottom: 10px;
  outline: none;
  transition: border-color 0.15s;
}

.add-form textarea {
  min-height: 80px;
  resize: vertical;
  line-height: 1.5;
}

.add-form input[type="date"],
.add-form input[type="time"] {
  -webkit-appearance: none;
  appearance: none;
  height: 46px;
  line-height: 46px;
}

.add-form input:focus, .add-form select:focus, .add-form textarea:focus {
  border-color: var(--ink);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.form-row > * {
  min-width: 0;
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.star-rating {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.star-rating .star {
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
}

.star-rating .star:hover { transform: scale(1.2); }
.star-rating .star.active { color: var(--accent3); }
.star-rating .star.inactive { color: var(--border); }

.add-form-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  margin-bottom: 14px;
  color: var(--ink);
}

/* Tag chip input */
.tag-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: var(--cream);
  margin-bottom: 10px;
  cursor: text;
  min-height: 46px;
  box-sizing: border-box;
  width: 100%;
  transition: border-color 0.15s;
}

.tag-input-wrapper:focus-within {
  border-color: var(--ink);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--ink);
  color: white;
  border-radius: 100px;
  padding: 3px 8px 3px 10px;
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
}

.tag-chip-remove {
  background: none;
  border: none;
  color: white;
  opacity: 0.6;
  cursor: pointer;
  font-size: 15px;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.tag-chip-remove:hover { opacity: 1; }

.add-form .tag-input {
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
  background: transparent !important;
  width: 100% !important;
  min-width: 60px;
  outline: none;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: var(--ink);
}

.tag-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: -10px;
  right: -10px;
  background: var(--cream);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  z-index: 100;
  max-height: 180px;
  overflow-y: auto;
}

.tag-dropdown-item {
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  color: var(--ink);
  border-radius: 10px;
}

.tag-dropdown-item:hover { background: var(--warm); }

/* Filter chip bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: var(--cream);
  color: var(--muted);
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip.active {
  background: var(--ink);
  color: white;
  border-color: var(--ink);
}

.btn-row {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary { background: var(--ink); color: white; }
.btn-secondary { background: var(--warm); color: var(--muted); }
.btn:hover { opacity: 0.85; }

.btn-delete {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-delete:hover {
  background: #FEE9E5;
  color: var(--accent);
}

.btn-edit {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-edit:hover {
  background: #E3F0EE;
  color: var(--accent2);
}
`

export default forms
