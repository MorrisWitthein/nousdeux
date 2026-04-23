package main

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mwitthein/nousdeux-api/sse"
)

var (
	pool *pgxpool.Pool

	eventsBroker     = sse.NewBroker()
	recipesBroker    = sse.NewBroker()
	seriesBroker     = sse.NewBroker()
	activitiesBroker = sse.NewBroker()
	moviesBroker     = sse.NewBroker()
)
