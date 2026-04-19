import { useState } from 'react'
import styles from './styles.js'
import { getCurrentUser } from './parseJwt.js'
import { useEvents } from './hooks/useEvents.js'
import { useRecipes } from './hooks/useRecipes.js'
import { useSeries } from './hooks/useSeries.js'
import { useActivities } from './hooks/useActivities.js'
import HomeTab from './tabs/HomeTab.jsx'
import CalendarTab from './tabs/CalendarTab.jsx'
import ListsTab from './tabs/ListsTab.jsx'
import RecipesTab from './tabs/RecipesTab.jsx'

const tabs = [
  { id: 'home',     icon: '🏠', label: 'Home' },
  { id: 'calendar', icon: '📅', label: 'Termine' },
  { id: 'lists',    icon: '🍿', label: 'Listen' },
  { id: 'recipes',  icon: '🍳', label: 'Rezepte' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [calendarTarget, setCalendarTarget] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const currentUser = getCurrentUser()

  const navigateToCalendar = (isoDate) => {
    setCalendarTarget(isoDate ?? null)
    setActiveTab('calendar')
  }

  const navigateTo = (tab) => setActiveTab(tab)

  const handleLogout = () => {
    if (window.__nousdeux_logout) window.__nousdeux_logout()
    setShowProfile(false)
  }

  const { events,     addEvent,    updateEvent,    deleteEvent }    = useEvents()
  const { recipes,    addRecipe,   updateRecipe,   deleteRecipe }   = useRecipes()
  const { series,     addSeries,   updateSeries,   deleteSeries }   = useSeries()
  const { activities, addActivity, updateActivity, deleteActivity } = useActivities()

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
                className="avatar avatar-b"
                style={{ cursor: 'pointer' }}
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
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab events={events} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} currentUser={currentUser} targetDate={calendarTarget} onTargetConsumed={() => setCalendarTarget(null)} />
          )}
          {activeTab === 'lists' && (
            <ListsTab
              series={series} addSeries={addSeries} updateSeries={updateSeries} deleteSeries={deleteSeries}
              activities={activities} addActivity={addActivity} updateActivity={updateActivity} deleteActivity={deleteActivity}
              currentUser={currentUser}
            />
          )}
          {activeTab === 'recipes' && (
            <RecipesTab recipes={recipes} addRecipe={addRecipe} updateRecipe={updateRecipe} deleteRecipe={deleteRecipe} currentUser={currentUser} />
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
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(28,26,23,0.4)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'flex-end',
            }}
            onClick={() => setShowProfile(false)}
          >
            <div
              style={{
                width: '100%', maxWidth: 390, margin: '0 auto',
                background: 'var(--cream)', borderRadius: '24px 24px 0 0',
                padding: '28px 24px 40px', animation: 'fadeUp 0.25s ease',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--accent2)', display: 'flex',
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
              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '14px', borderRadius: 14 }}
                onClick={handleLogout}
              >
                Ausloggen
              </button>
              <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16, opacity: 0.5 }}>
                v{__APP_VERSION__}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
