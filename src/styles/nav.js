const nav = `
/* ADD BUTTON */
.fab {
  position: fixed;
  bottom: 84px;
  right: 24px;
  width: 52px; height: 52px;
  background: var(--accent);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(200,85,61,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, box-shadow 0.15s;
  z-index: 20;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 28px rgba(200,85,61,0.5);
}

/* BOTTOM NAV */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 390px;
  background: rgba(245,240,232,0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  display: flex;
  padding: 10px 0 24px;
  z-index: 20;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 0.15s;
}

.nav-item:hover { opacity: 0.7; }

.nav-icon {
  font-size: 22px;
  transition: transform 0.2s;
}

.nav-item.active .nav-icon { transform: scale(1.15); }

.nav-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  transition: color 0.15s;
}

.nav-item.active .nav-label { color: var(--ink); font-weight: 600; }

/* ACTIVITY CARDS */
.activity-card {
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 10px;
  display: flex;
  gap: 14px;
  align-items: center;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--card);
  transition: transform 0.15s;
}

.activity-card:hover { transform: translateY(-1px); }

.activity-icon {
  font-size: 32px;
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--warm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
`

export default nav
