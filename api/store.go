package main

import (
	"sync"

	"github.com/mwitthein/nosdeux-api/sse"
)

var (
	mu         sync.RWMutex
	events     []Event
	recipes    []Recipe
	series     []Series
	activities []Activity

	eventsBroker     = sse.NewBroker()
	recipesBroker    = sse.NewBroker()
	seriesBroker     = sse.NewBroker()
	activitiesBroker = sse.NewBroker()
)
