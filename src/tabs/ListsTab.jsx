import SeriesSubTab from './lists/SeriesSubTab.jsx'
import MoviesSubTab from './lists/MoviesSubTab.jsx'
import ActivitiesSubTab from './lists/ActivitiesSubTab.jsx'
import ShoppingSubTab from './lists/ShoppingSubTab.jsx'

const LISTS = [
  ['series', '🍿 Serien'],
  ['movies', '🎬 Filme'],
  ['activities', '✨ Aktivitäten'],
  ['shopping', '🛒 Einkauf'],
]

export default function ListsTab({
  series, addSeries, updateSeries, deleteSeries, seriesLoading, setSeriesImage, clearSeriesImage, fetchSeriesMeta, patchSeriesImage,
  activities, addActivity, updateActivity, deleteActivity, activitiesLoading,
  movies, addMovie, updateMovie, deleteMovie, moviesLoading, setMovieImage, clearMovieImage, fetchMovieMeta, patchMovieImage,
  currentUser,
  onNavigateToCalendar,
  activeList,
  setActiveList,
}) {
  return (
    <div>
      <p className="section-title">Eure <em>Listen</em></p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {LISTS.map(([key, label]) => (
          <button
            key={key}
            className={`tab${activeList === key ? ' active' : ''}`}
            onClick={() => setActiveList(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeList === 'series' && (
        <SeriesSubTab
          series={series} addSeries={addSeries} updateSeries={updateSeries} deleteSeries={deleteSeries}
          seriesLoading={seriesLoading} setSeriesImage={setSeriesImage} clearSeriesImage={clearSeriesImage}
          fetchSeriesMeta={fetchSeriesMeta} patchSeriesImage={patchSeriesImage}
          currentUser={currentUser}
        />
      )}

      {activeList === 'movies' && (
        <MoviesSubTab
          movies={movies} addMovie={addMovie} updateMovie={updateMovie} deleteMovie={deleteMovie}
          moviesLoading={moviesLoading} setMovieImage={setMovieImage} clearMovieImage={clearMovieImage}
          fetchMovieMeta={fetchMovieMeta} patchMovieImage={patchMovieImage}
          currentUser={currentUser}
        />
      )}

      {activeList === 'activities' && (
        <ActivitiesSubTab
          activities={activities} addActivity={addActivity} updateActivity={updateActivity} deleteActivity={deleteActivity}
          activitiesLoading={activitiesLoading}
          currentUser={currentUser} onNavigateToCalendar={onNavigateToCalendar}
        />
      )}

      {activeList === 'shopping' && <ShoppingSubTab currentUser={currentUser} />}
    </div>
  )
}
