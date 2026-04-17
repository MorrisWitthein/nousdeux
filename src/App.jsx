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
import ActivitiesTab from './tabs/ActivitiesTab.jsx'

const tabs = [
  { id: 'home',       icon: '🏠', label: 'Home' },
  { id: 'calendar',   icon: '📅', label: 'Termine' },
  { id: 'lists',      icon: '🍿', label: 'Listen' },
  { id: 'recipes',    icon: '🍳', label: 'Rezepte' },
  { id: 'activities', icon: '✨', label: 'Aktivitäten' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const currentUser = getCurrentUser()

  const { events,     addEvent,    deleteEvent }    = useEvents()
  const { recipes,    addRecipe,   deleteRecipe }   = useRecipes()
  const { series,     addSeries,   deleteSeries }   = useSeries()
  const { activities, addActivity, deleteActivity } = useActivities()

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grain" />

        <div className="header">
          <div className="header-top">
            <div className="logo">nous<span>deux</span></div>
            {currentUser && (
              <div className="avatar avatar-b">{currentUser.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div className="tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="content">
          {activeTab === 'home' && (
            <HomeTab events={events} recipes={recipes} series={series} activities={activities} />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab events={events} addEvent={addEvent} deleteEvent={deleteEvent} currentUser={currentUser} />
          )}
          {activeTab === 'lists' && (
            <ListsTab series={series} addSeries={addSeries} deleteSeries={deleteSeries} />
          )}
          {activeTab === 'recipes' && (
            <RecipesTab recipes={recipes} addRecipe={addRecipe} deleteRecipe={deleteRecipe} currentUser={currentUser} />
          )}
          {activeTab === 'activities' && (
            <ActivitiesTab activities={activities} addActivity={addActivity} deleteActivity={deleteActivity} currentUser={currentUser} />
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
      </div>
    </>
  )
}
