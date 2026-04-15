export const initialData = {
  events: [
    { id: 1, title: 'Weinprobe in der Altstadt', date: 'Sa, 19. Apr', time: '18:00 Uhr', who: 'L', badge: 'Datum fix', badgeType: 'red' },
    { id: 2, title: 'Yoga im Park', date: 'So, 20. Apr', time: '10:00 Uhr', who: 'M', badge: 'Geplant', badgeType: 'green' },
    { id: 3, title: 'Konzert – Cigarettes After Sex', date: 'Fr, 25. Apr', time: '20:00 Uhr', who: 'L', badge: 'Tickets kaufen', badgeType: 'yellow' },
  ],
  recipes: [
    { id: 1, emoji: '🍝', title: 'Pasta Cacio e Pepe', tags: ['30 Min', 'Veggie', 'Einfach'], who: 'M', rating: '4.8' },
    { id: 2, emoji: '🥘', title: 'Marokkanisches Hähnchen', tags: ['60 Min', 'Meal Prep'], who: 'L', rating: '4.6' },
    { id: 3, emoji: '🥗', title: 'Sommersalat mit Burrata', tags: ['15 Min', 'Leicht', 'Veggie'], who: 'M', rating: '4.9' },
    { id: 4, emoji: '🍜', title: 'Ramen von Grund auf', tags: ['3h', 'Wochenende'], who: 'L', rating: '5.0' },
  ],
  series: [
    { id: 1, emoji: '🎭', title: 'The Bear', sub: 'Staffel 3 · Hulu', progress: 40, status: 'Läuft', statusType: 'green' },
    { id: 2, emoji: '🌊', title: 'White Lotus', sub: 'Staffel 2 · HBO', progress: 100, status: 'Fertig', statusType: 'gray' },
    { id: 3, emoji: '🔪', title: 'Severance', sub: 'Staffel 2 · Apple TV+', progress: 0, status: 'Geplant', statusType: 'yellow' },
    { id: 4, emoji: '🤖', title: 'Silo', sub: 'Staffel 2 · Apple TV+', progress: 70, status: 'Läuft', statusType: 'green' },
  ],
  activities: [
    { id: 1, emoji: '🎨', title: 'Keramikkurs', meta: 'Sa Vormittag · Altstadt', who: 'L' },
    { id: 2, emoji: '🚴', title: 'Radtour ans Meer', meta: 'Wochenende · ~40 km', who: 'M' },
    { id: 3, emoji: '🎭', title: 'Improtheater-Abend', meta: 'Fr Abend · Innenstadt', who: 'L' },
    { id: 4, emoji: '🧗', title: 'Kletterhalle ausprobieren', meta: 'Unter der Woche', who: 'M' },
  ],
}

// April 2026 calendar layout (Mon–Sun, null = empty cell)
export const calDays = [
  null, null, 1,  2,  3,  4,  5,
  6,    7,    8,  9,  10, 11, 12,
  13,   14,   15, 16, 17, 18, 19,
  20,   21,   22, 23, 24, 25, 26,
  27,   28,   29, 30, null, null, null,
]

export const today = 14
