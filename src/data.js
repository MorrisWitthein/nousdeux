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
    { id: 1, emoji: '🎭', title: 'The Bear', sub: 'Hulu', season: 3, progress: 0, status: 'Läuft', statusType: 'green' },
    { id: 2, emoji: '🌊', title: 'White Lotus', sub: 'HBO', season: 2, progress: 0, status: 'Fertig', statusType: 'red' },
    { id: 3, emoji: '🔪', title: 'Severance', sub: 'Apple TV+', season: 2, progress: 0, status: 'Geplant', statusType: 'yellow' },
    { id: 4, emoji: '🤖', title: 'Silo', sub: 'Apple TV+', season: 2, progress: 0, status: 'Läuft', statusType: 'green' },
  ],
  activities: [
    { id: 1, emoji: '🎨', title: 'Keramikkurs', meta: 'Altstadt', who: 'L', status: 'Geplant' },
    { id: 2, emoji: '🚴', title: 'Radtour ans Meer', meta: '~40 km', who: 'M', status: 'Idee' },
    { id: 3, emoji: '🎭', title: 'Improtheater-Abend', meta: 'Innenstadt', who: 'L', status: 'Idee' },
    { id: 4, emoji: '🧗', title: 'Kletterhalle ausprobieren', meta: '', who: 'M', status: 'Gemacht' },
  ],
}
