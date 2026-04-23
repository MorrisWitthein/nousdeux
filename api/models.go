package main

import (
	"time"
)

// Event mirrors the events table.
type Event struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Date      string    `json:"date,omitempty"`
	EndDate   string    `json:"endDate,omitempty"`
	Time      string    `json:"time,omitempty"`
	Who       string    `json:"who"`
	Badge     string    `json:"badge,omitempty"`
	BadgeType string    `json:"badgeType,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// Recipe mirrors the recipes table.
type Recipe struct {
	ID          string    `json:"id"`
	Emoji       string    `json:"emoji,omitempty"`
	Title       string    `json:"title"`
	Tags        []string  `json:"tags,omitempty"`
	Who         string    `json:"who"`
	Rating      int       `json:"rating"`
	Ingredients string    `json:"ingredients,omitempty"`
	Steps       string    `json:"steps,omitempty"`
	PrepTime    *int      `json:"prepTime,omitempty"`
	Servings    *int      `json:"servings,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// Series mirrors the series table.
type Series struct {
	ID         string    `json:"id"`
	Emoji      string    `json:"emoji,omitempty"`
	Title      string    `json:"title"`
	Sub        string    `json:"sub,omitempty"`
	Progress   int       `json:"progress"`
	Status     string    `json:"status,omitempty"`
	StatusType string    `json:"statusType,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Movie mirrors the movies table.
type Movie struct {
	ID         string    `json:"id"`
	Emoji      string    `json:"emoji,omitempty"`
	Title      string    `json:"title"`
	Sub        string    `json:"sub,omitempty"`
	Status     string    `json:"status,omitempty"`
	StatusType string    `json:"statusType,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Activity mirrors the activities table.
type Activity struct {
	ID        string    `json:"id"`
	Emoji     string    `json:"emoji,omitempty"`
	Title     string    `json:"title"`
	Meta      string    `json:"meta,omitempty"`
	Who       string    `json:"who"`
	Date      string    `json:"date,omitempty"`
	Time      string    `json:"time,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
