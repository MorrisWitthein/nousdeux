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
  from { transform: translateX(-105%); }
  to   { transform: translateX(0); }
}
@keyframes slideInFromRight {
  from { transform: translateX(105%); }
  to   { transform: translateX(0); }
}
@keyframes slideOutToLeft {
  from { transform: translateX(0); }
  to   { transform: translateX(-105%); }
}
@keyframes slideOutToRight {
  from { transform: translateX(0); }
  to   { transform: translateX(105%); }
}
`

export default base
