const nav = `
/* ADD BUTTON */
.fab {
  position: fixed;
  bottom: 100px;
  right: calc(max(0px, (100vw - 390px) / 2) + 24px);
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

.fab.fab-open {
  transform: rotate(45deg);
}

.fab.fab-open:hover {
  transform: rotate(45deg) scale(1.05);
}

.fab-menu {
  position: fixed;
  bottom: 162px;
  right: calc(max(0px, (100vw - 390px) / 2) + 24px);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 20;
}

.fab-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 28px;
  padding: 9px 16px 9px 14px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  white-space: nowrap;
  animation: fabSubIn 0.18s ease both;
  color: var(--ink);
}

.fab-sub:nth-child(2) {
  animation-delay: 0.04s;
}

.fab-sub span.fab-sub-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.fab-sub-icon {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.fab-sub-icon.create { background: var(--accent); color: white; }
.fab-sub-icon.import { background: var(--accent2); color: white; }

.fab-backdrop {
  position: fixed;
  inset: 0;
  z-index: 19;
}

@keyframes fabSubIn {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
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
  background: none;
  border: none;
  font-family: inherit;
  color: inherit;
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
`

export default nav
