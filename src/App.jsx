import { useState } from 'react'
import styles from './styles/index.js'
import { getCurrentUser, isAdmin } from './parseJwt.js'
import { authorColor } from './utils/authorColor.js'
import { useEvents } from './hooks/useEvents.js'
import { useRecipes } from './hooks/useRecipes.js'
import { useSeries } from './hooks/useSeries.js'
import { useActivities } from './hooks/useActivities.js'
import { useMovies } from './hooks/useMovies.js'
import { useWeather } from './hooks/useWeather.js'
import { useSettings } from './hooks/useSettings.js'
import HomeTab from './tabs/HomeTab.jsx'
import CalendarTab from './tabs/CalendarTab.jsx'
import ListsTab from './tabs/ListsTab.jsx'
import RecipesTab from './tabs/RecipesTab.jsx'
import ProfileModal from './components/ProfileModal.jsx'

const tabs = [
  { id: 'home',     icon: '🏠', label: 'Home' },
  { id: 'calendar', icon: '📅', label: 'Termine' },
  { id: 'lists',    icon: '🍿', label: 'Listen' },
  { id: 'recipes',  icon: '🍳', label: 'Rezepte' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  // Lifted out of ListsTab so the chosen sub-list survives switching tabs.
  const [listsActiveList, setListsActiveList] = useState('series')
  const [calendarTarget, setCalendarTarget] = useState(null)
  const [calendarPrefill, setCalendarPrefill] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const currentUser = getCurrentUser()

  const navigateToCalendar = (isoDate, prefill = null) => {
    setCalendarTarget(isoDate ?? null)
    setCalendarPrefill(prefill)
    setActiveTab('calendar')
  }

  const navigateTo = (tab) => setActiveTab(tab)

  const handleLogout = () => {
    if (window.__nousdeux_logout) window.__nousdeux_logout()
    setShowProfile(false)
  }

  const { events, loading: eventsLoading, addEvent, updateEvent, deleteEvent, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl } = useEvents()
  const { recipes, loading: recipesLoading, addRecipe, updateRecipe, deleteRecipe, setRecipeImage, uploadRecipeImage, clearRecipeImage, importRecipe }   = useRecipes()
  const { series,     loading: seriesLoading,     addSeries,   updateSeries,   deleteSeries, setSeriesImage, clearSeriesImage, fetchSeriesMeta, patchSeriesImage }   = useSeries()
  const { activities, loading: activitiesLoading, addActivity, updateActivity, deleteActivity } = useActivities()
  const { movies, loading: moviesLoading, addMovie, updateMovie, deleteMovie, setMovieImage, clearMovieImage, fetchMovieMeta, patchMovieImage } = useMovies()
  const weatherEmoji = useWeather()
  const { settings, updateSetting } = useSettings()
  const userIsAdmin = isAdmin()

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grain" />

        <div className="header">
          <div className="header-top">
            <div className="logo">nous<span>deux</span></div>
            {currentUser && (
              <button
                type="button"
                className="avatar"
                aria-label="Profil öffnen"
                style={{ background: authorColor(currentUser, currentUser), cursor: 'pointer', border: 'none', padding: 0, fontFamily: 'inherit' }}
                onClick={() => setShowProfile(true)}
              >
                {currentUser.charAt(0).toUpperCase()}
              </button>
            )}
          </div>
        </div>

        <div className="content">
          {activeTab === 'home' && (
            <HomeTab
              events={events}
              recipes={recipes}
              series={series}
              activities={activities}
              onNavigateToCalendar={navigateToCalendar}
              onNavigate={navigateTo}
              currentUser={currentUser}
              weatherEmoji={weatherEmoji}
              genzMode={settings.genz_mode === true}
              loading={eventsLoading || seriesLoading || recipesLoading || activitiesLoading}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab events={events} loading={eventsLoading} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} currentUser={currentUser} targetDate={calendarTarget} onTargetConsumed={() => setCalendarTarget(null)} prefill={calendarPrefill} onPrefillConsumed={() => setCalendarPrefill(null)} listAttachments={listAttachments} uploadAttachment={uploadAttachment} deleteAttachment={deleteAttachment} attachmentUrl={attachmentUrl} />
          )}
          {activeTab === 'lists' && (
            <ListsTab
              series={series} addSeries={addSeries} updateSeries={updateSeries} deleteSeries={deleteSeries} seriesLoading={seriesLoading}
              setSeriesImage={setSeriesImage} clearSeriesImage={clearSeriesImage} fetchSeriesMeta={fetchSeriesMeta} patchSeriesImage={patchSeriesImage}
              activities={activities} addActivity={addActivity} updateActivity={updateActivity} deleteActivity={deleteActivity} activitiesLoading={activitiesLoading}
              movies={movies} addMovie={addMovie} updateMovie={updateMovie} deleteMovie={deleteMovie} moviesLoading={moviesLoading}
              setMovieImage={setMovieImage} clearMovieImage={clearMovieImage} fetchMovieMeta={fetchMovieMeta} patchMovieImage={patchMovieImage}
              currentUser={currentUser}
              onNavigateToCalendar={navigateToCalendar}
              activeList={listsActiveList}
              setActiveList={setListsActiveList}
            />
          )}
          {activeTab === 'recipes' && (
            <RecipesTab recipes={recipes} loading={recipesLoading} addRecipe={addRecipe} updateRecipe={updateRecipe} deleteRecipe={deleteRecipe} setRecipeImage={setRecipeImage} uploadRecipeImage={uploadRecipeImage} clearRecipeImage={clearRecipeImage} importRecipe={importRecipe} currentUser={currentUser} />
          )}
        </div>

        <div className="bottom-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`nav-item${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <div className="nav-icon">{t.icon}</div>
              <div className="nav-label">{t.label}</div>
            </button>
          ))}
        </div>

        {showProfile && (
          <ProfileModal
            currentUser={currentUser}
            userIsAdmin={userIsAdmin}
            settings={settings}
            updateSetting={updateSetting}
            onLogout={handleLogout}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>
    </>
  )
}
