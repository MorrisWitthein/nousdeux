const forms = `
/* Bottom sheet */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(28,26,23,0.45);
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

.sheet {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 390px;
  background: var(--cream);
  border-radius: 24px 24px 0 0;
  z-index: 201;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin: 12px auto 0;
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 10px;
  flex-shrink: 0;
}

.sheet-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  color: var(--ink);
}

.sheet-body {
  overflow-y: auto;
  padding: 4px 20px 40px;
  flex: 1;
}

.sheet-body input,
.sheet-body select,
.sheet-body textarea {
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

.sheet-body input:focus,
.sheet-body select:focus,
.sheet-body textarea:focus {
  border-color: var(--ink);
}

.sheet-body .tag-input {
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
  background: transparent !important;
  width: 100% !important;
  min-width: 60px;
}

.sheet-body .ingredient-row input,
.sheet-body .step-row input {
  margin-bottom: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(100%); }
  to { transform: translateX(-50%) translateY(0); }
}

/* Emoji picker */
.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  margin-bottom: 12px;
}

.emoji-option {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}

.emoji-option:hover,
.emoji-option.selected {
  background: var(--warm);
}

/* Ingredient / step rows */
.ingredient-row,
.step-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--ink);
  color: white;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'DM Sans', sans-serif;
}

.add-row-btn {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1.5px dashed var(--border);
  border-radius: 12px;
  background: none;
  color: var(--muted);
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  margin-bottom: 14px;
  transition: all 0.15s;
}

.add-row-btn:hover {
  border-color: var(--ink);
  color: var(--ink);
}

/* Recipe detail view */
.recipe-detail-emoji {
  font-size: 64px;
  text-align: center;
  padding: 8px 0 4px;
}

.recipe-detail-section {
  margin-top: 20px;
}

.recipe-detail-section-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.recipe-detail-ingredient {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--ink);
  line-height: 1.4;
}

.recipe-detail-step {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--ink);
  line-height: 1.5;
  align-items: flex-start;
}

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
