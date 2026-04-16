package main

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mwitthein/nosdeux-api/sse"
)

var (
	pool *pgxpool.Pool

	eventsBroker     = sse.NewBroker()
	recipesBroker    = sse.NewBroker()
	seriesBroker     = sse.NewBroker()
	activitiesBroker = sse.NewBroker()
)
