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
import Sheet from './components/Sheet.jsx'
import PasswordChange from './components/PasswordChange.jsx'

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
  const { series,     loading: seriesLoading,     addSeries,   updateSeries,   deleteSeries, setSeriesImage, clearSeriesImage }   = useSeries()
  const { activities, loading: activitiesLoading, addActivity, updateActivity, deleteActivity } = useActivities()
  const { movies, loading: moviesLoading, addMovie, updateMovie, deleteMovie, setMovieImage, clearMovieImage } = useMovies()
  const weatherEmoji = useWeather()
  const { settings, updateSetting } = useSettings()
  const userIsAdmin = isAdmin()

  const displayName = currentUser
    ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1)
    : null

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grain" />

        <div className="header">
          <div className="header-top">
            <div className="logo">nous<span>deux</span></div>
            {currentUser && (
              <div
                className="avatar"
                style={{ background: authorColor(currentUser, currentUser), cursor: 'pointer' }}
                onClick={() => setShowProfile(true)}
              >
                {currentUser.charAt(0).toUpperCase()}
              </div>
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
              setSeriesImage={setSeriesImage} clearSeriesImage={clearSeriesImage}
              activities={activities} addActivity={addActivity} updateActivity={updateActivity} deleteActivity={deleteActivity} activitiesLoading={activitiesLoading}
              movies={movies} addMovie={addMovie} updateMovie={updateMovie} deleteMovie={deleteMovie} moviesLoading={moviesLoading}
              setMovieImage={setMovieImage} clearMovieImage={clearMovieImage}
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
            <div
              key={t.id}
              className={`nav-item${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <div className="nav-icon">{t.icon}</div>
              <div className="nav-label">{t.label}</div>
            </div>
          ))}
        </div>

        {showProfile && (
          <Sheet title="Profil" onClose={() => setShowProfile(false)}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: authorColor(currentUser, currentUser), display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: 'white', fontWeight: 500,
              }}>
                {currentUser?.charAt(0).toUpperCase()}
              </div>
            </div>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 300,
              color: 'var(--ink)', textAlign: 'center', marginBottom: 4,
            }}>
              {displayName}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 28 }}>
              {currentUser}@nousdeux
            </p>
            {userIsAdmin && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Admin
                </p>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 14, background: 'var(--warm)',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--ink)' }}>Gen-Z Modus</span>
                  <div
                    style={{
                      width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
                      background: settings.genz_mode ? 'var(--accent)' : 'var(--muted)',
                      position: 'relative', transition: 'background 0.2s',
                      opacity: settings.genz_mode === undefined ? 0.4 : 1,
                    }}
                    onClick={() => updateSetting('genz_mode', !settings.genz_mode)}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: settings.genz_mode ? 21 : 3,
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
              </div>
            )}
            <PasswordChange />
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '14px', borderRadius: 14 }}
              onClick={handleLogout}
            >
              Ausloggen
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16, opacity: 0.5 }}>
              <a
                href={`https://github.com/MorrisWitthein/nousdeux/releases/tag/v${__APP_VERSION__}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                v{__APP_VERSION__}
              </a>
            </p>
          </Sheet>
        )}
      </div>
    </>
  )
}
