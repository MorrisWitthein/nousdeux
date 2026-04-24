// Compute Easter Sunday for a given year (Anonymous Gregorian algorithm)
function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function getSpecialDay(now) {
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const day = now.getDate()
  const weekday = now.getDay() // 0=Sun, 6=Sat

  // Fixed public holidays (month is 0-based)
  const fixed = [
    { m: 0,  d: 1,  label: 'Frohes neues Jahr',      emoji: '🎆' },
    { m: 0,  d: 6,  label: 'Frohen Dreikönigstag',   emoji: '✨' },
    { m: 3,  d: 1,  labels: ['67', 'Slay', 'No cap', 'Lowkey sus heute', 'Schere Firma Diggi', 'Rede mein Löwe'], emojis: ['💀', '🔥', '😭', '✨', '🫡', '✂️', '🦁'] },
    { m: 4,  d: 1,  label: 'Schönen Tag der Arbeit',  emoji: '🔨' },
    { m: 9,  d: 3,  label: 'Tag der Deutschen Einheit', emoji: '🇩🇪' },
    { m: 10, d: 1,  label: 'Besinnlichen Allerheiligen', emoji: '🕯️' },
    { m: 11, d: 6,  label: 'Frohen Nikolaustag',       emoji: '🎅' },
    { m: 11, d: 24, label: 'Frohe Weihnachten',        emoji: '🎄' },
    { m: 11, d: 25, label: 'Frohe Weihnachten',        emoji: '🎄' },
    { m: 11, d: 26, label: 'Frohe Weihnachten',        emoji: '🎄' },
    { m: 11, d: 31, label: 'Guten Rutsch',             emoji: '🥂' },
  ]
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  for (const h of fixed) {
    if (h.m === month && h.d === day) {
      const label = h.labels ? pick(h.labels) : h.label
      const emoji = h.emojis ? pick(h.emojis) : h.emoji
      return { label, emoji, isHoliday: true }
    }
  }

  // Movable Easter-based holidays
  const easter = easterSunday(year)
  const movable = [
    { date: addDays(easter, -2), label: 'Besinnlichen Karfreitag', emoji: '✝️' },
    { date: easter,              label: 'Frohe Ostern',           emoji: '🐣' },
    { date: addDays(easter,  1), label: 'Frohe Ostern',           emoji: '🐰' },
    { date: addDays(easter, 39), label: 'Frohen Himmelfahrtstag', emoji: '⛅' },
    { date: addDays(easter, 49), label: 'Frohen Pfingstsonntag',  emoji: '🕊️' },
    { date: addDays(easter, 50), label: 'Frohen Pfingstmontag',   emoji: '🕊️' },
  ]
  for (const h of movable) {
    if (h.date.getMonth() === month && h.date.getDate() === day) {
      return { label: h.label, emoji: h.emoji, isHoliday: true }
    }
  }

  // Weekend
  if (weekday === 6) return { label: 'Schönen Samstag', emoji: '😎', isHoliday: false }
  if (weekday === 0) return { label: 'Schönen Sonntag', emoji: '☕', isHoliday: false }

  return null
}

export default function HomeTab({ events, recipes, series, activities, onNavigateToCalendar, onNavigate, currentUser }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hour = now.getHours()

  const name = currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : null

  const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const weekday = now.getDay() // 0=Sun, 6=Sat
  const isWeekend = weekday === 0 || weekday === 6

  const greetings = hour < 5
    ? {
        texts: ['Gute Nacht', 'Noch wach?', 'Nachtschicht?', 'Die Welt schläft', 'Schlaflos?', 'Mitten in der Nacht'],
        emojis: ['🌙', '🌛', '🌟', '🦉', '💤', '🌌'],
        subs: ['Nicht zu lange aufbleiben', 'Ruh dich aus', 'Schlaf gut', 'Träum was Schönes', 'Morgen ist auch noch ein Tag', 'Die Welt kann warten'],
      }
    : hour < 9
    ? {
        texts: ['Guten Morgen', 'Moin', 'Aufgewacht', 'Einen schönen Morgen', 'Hallo ihr zwei', 'Rise and shine', 'Morgen!', 'Na, ausgeschlafen?'],
        emojis: ['☀️', '🌅', '🥐', '☕', '🌤️', '🍳', '🌸', '🐦'],
        subs: isWeekend
          ? ['Schönes Wochenende', 'Genießt den Morgen', 'Kein Stress heute', 'Einfach mal entspannen', 'Schlafen war gestern', 'Wochenende, endlich!', 'Kaffee first']
          : ['Frisch in den Tag', 'Was steht heute an?', 'Einen guten Start', 'Habt einen tollen Tag', 'Kaffee und los', 'Der frühe Vogel…', 'Alles wird gut'],
      }
    : hour < 12
    ? {
        texts: ['Guten Morgen', 'Na, schon wach?', 'Guten Morgen noch', 'Hallo ihr zwei', 'Moin moin', 'Hey ihr!', 'Na Moin'],
        emojis: ['☀️', '🌻', '🍳', '🎶', '🌈', '🍵', '😊'],
        subs: isWeekend
          ? ['Relaxter Morgen', 'Wochenende genießen', 'Kein Stress heute', 'Gut so', 'Einfach schön', 'So soll\'s sein', 'Morgen für euch']
          : ['Was steht heute an?', 'Habt einen guten Tag', 'Los geht\'s', 'Volle Kraft voraus', 'Ihr schafft das', 'Heute wird gut', 'Auf geht\'s'],
      }
    : hour < 14
    ? {
        texts: ['Hallo', 'Mittagszeit', 'Mahlzeit', 'Guten Mittag', 'Hey ihr zwei', 'Hungerig?', 'Na ihr?', 'Mitten im Tag'],
        emojis: ['🍽️', '☀️', '🥗', '🌮', '😋', '🍜', '🥪', '🫶'],
        subs: isWeekend
          ? ['Schöner Mittag', 'Genießt euer Wochenende', 'Vielleicht was Leckeres?', 'Relaxen', 'Einfach genießen', 'Zeit für euch', 'Mittag, yeah']
          : ['Mittagspause verdient', 'Kurz durchatmen', 'Was gibt\'s heute?', 'Halb gewonnen', 'Pause!', 'Ihr habt euch das verdient', 'Kurz die Beine hochlegen'],
      }
    : hour < 18
    ? {
        texts: ['Guten Tag', 'Hallo', 'Schönen Nachmittag', 'Hey', 'Na ihr zwei', 'Wie läuft\'s?', 'Alles gut?', 'Moin noch'],
        emojis: ['🌤️', '🌞', '🍀', '☕', '✨', '🎵', '🌿', '🍰'],
        subs: isWeekend
          ? ['Schöner Nachmittag', 'Wochenende pur', 'Genießt die Zeit', 'Habt Spaß', 'Das Leben ist schön', 'Einfach gut', 'So soll\'s sein']
          : ['Noch ein paar Stunden', 'Fast geschafft', 'Durchhalten', 'Der Abend kommt', 'Bald Feierabend', 'Letzte Runde', 'Ihr schafft das'],
      }
    : hour < 22
    ? {
        texts: ['Guten Abend', 'Schönen Abend', 'Hallo', 'Na ihr zwei', 'Hey', 'Abend!', 'Wie war euer Tag?', 'Endlich Abend'],
        emojis: ['🌙', '🌆', '🍷', '🛋️', '✨', '🕯️', '🌃', '🫶'],
        subs: isWeekend
          ? ['Schöner Abend noch', 'Genießt die Nacht', 'Schönes Wochenende', 'Abend gemütlich ausklingen', 'Cozy evening', 'Einfach schön', 'Genießt es']
          : ['Feierabend!', 'Gut gemacht heute', 'Abend gehört euch', 'Endlich Ruhe', 'Verdient', 'Jetzt entspannen', 'Der Tag ist eurer'],
      }
    : {
        texts: ['Noch auf?', 'Spät noch wach?', 'Nachteulen', 'Schlaflos?', 'Mitten in der Nacht', 'Hey ihr zwei'],
        emojis: ['🌙', '🌃', '🦉', '⭐', '💫', '🌌'],
        subs: ['Nicht zu lange', 'Schlaf gut bald', 'Der Tag war lang', 'Bald Zeit fürs Bett', 'Morgen wartet', 'Irgendwann schlafen'],
      }

  const timeGreeting = rnd(greetings.texts)
  const timeEmoji = rnd(greetings.emojis)
  const timeSub = rnd(greetings.subs)

  const special = getSpecialDay(now)

  const today = now.toISOString().slice(0, 10)
  const thisMonth = today.slice(0, 7) // "YYYY-MM"
  const nextEvent = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))[0] ?? null

  function formatEventDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const eventDate = new Date(y, m - 1, d)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.round((eventDate - todayMidnight) / 86400000)
    if (diffDays === 0) return 'Heute'
    if (diffDays === 1) return 'Morgen'
    if (diffDays <= 3) return eventDate.toLocaleDateString('de-DE', { weekday: 'long' })
    return dateStr
  }
  const runningSeries = series.filter(s => s.status === 'Läuft').length

  return (
    <div>
      {special ? (
        <p className="greeting">
          {special.label}{name ? `, ${name}` : ''}! {special.emoji}
          <br />
          <span style={{ fontSize: '0.75em', opacity: 0.7 }}>{timeGreeting} {timeEmoji}</span>
        </p>
      ) : (
        <p className="greeting">
          {timeGreeting}{name ? `, ${name}` : ''}!
          <br />
          <em>{name ? timeSub : 'ihr zwei'}</em> {timeEmoji}
        </p>
      )}
      <div
        className="date-chip"
        style={{ cursor: 'pointer' }}
        onClick={() => onNavigateToCalendar?.()}
      >
        📅 {dateStr}
      </div>

      {nextEvent && (
        <div
          className="next-up"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateToCalendar?.(nextEvent.date)}
        >
          <div className="next-up-label">Als nächstes</div>
          <div className="next-up-title">{nextEvent.title}</div>
          <div className="next-up-time">{formatEventDate(nextEvent.date)}{nextEvent.time ? ` · ${nextEvent.time}` : ''}</div>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('calendar')}>
          <div className="stat-icon">📅</div>
          <div className="stat-number">{events.filter(e => e.date?.startsWith(thisMonth)).length}</div>
          <div className="stat-label">Events diesen Monat</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('lists')}>
          <div className="stat-icon">🍿</div>
          <div className="stat-number">{runningSeries}</div>
          <div className="stat-label">Serien am Laufen</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('recipes')}>
          <div className="stat-icon">🍳</div>
          <div className="stat-number">{recipes.length}</div>
          <div className="stat-label">Rezepte gesammelt</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('lists')}>
          <div className="stat-icon">✨</div>
          <div className="stat-number">{activities.length}</div>
          <div className="stat-label">Aktivitäten geplant</div>
        </div>
      </div>
    </div>
  )
}
