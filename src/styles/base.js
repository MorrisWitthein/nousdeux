const base = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #F5F0E8;
  --warm: #EDE5D5;
  --ink: #1C1A17;
  --muted: #8A8070;
  --accent: #C8553D;
  --accent2: #4A7C6F;
  --accent3: #D4A853;
  --card: #FFFFFF;
  --border: rgba(28,26,23,0.1);
}

.app {
  font-family: 'DM Sans', sans-serif;
  background: var(--cream);
  min-height: 100vh;
  max-width: 390px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 150px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInFromLeft {
  from { transform: translate3d(-105%, 0, 0); }
  to   { transform: translate3d(0, 0, 0); }
}
@keyframes slideInFromRight {
  from { transform: translate3d(105%, 0, 0); }
  to   { transform: translate3d(0, 0, 0); }
}
@keyframes slideOutToLeft {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-105%, 0, 0); }
}
@keyframes slideOutToRight {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(105%, 0, 0); }
}
@keyframes toastIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 600;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: calc(100% - 32px);
  max-width: 358px;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  pointer-events: auto;
  animation: toastIn 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
}
.toast-error { background: var(--accent); color: #fff; }
.toast-close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
.toast-close:hover { opacity: 1; }
`

export default base
