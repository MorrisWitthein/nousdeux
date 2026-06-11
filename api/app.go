package main

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mwitthein/nousdeux-api/sse"
)

// App holds the shared dependencies (DB pool, SSE brokers, JWT secret) that the
// HTTP handlers operate on. Handlers are methods on *App so these collaborators
// are injected rather than reached through package-level globals.
type App struct {
	pool      *pgxpool.Pool
	jwtSecret []byte

	eventsBroker     *sse.Broker
	recipesBroker    *sse.Broker
	seriesBroker     *sse.Broker
	activitiesBroker *sse.Broker
	moviesBroker     *sse.Broker
	shoppingBroker   *sse.Broker
}

// newApp constructs an App with freshly created SSE brokers.
func newApp(pool *pgxpool.Pool, jwtSecret []byte) *App {
	return &App{
		pool:             pool,
		jwtSecret:        jwtSecret,
		eventsBroker:     sse.NewBroker(),
		recipesBroker:    sse.NewBroker(),
		seriesBroker:     sse.NewBroker(),
		activitiesBroker: sse.NewBroker(),
		moviesBroker:     sse.NewBroker(),
		shoppingBroker:   sse.NewBroker(),
	}
}
