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
  font-size: 14px;
  cursor: pointer;
  width: 28px;
  height: 28px;
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
  font-size: 14px;
  cursor: pointer;
  width: 28px;
  height: 28px;
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
