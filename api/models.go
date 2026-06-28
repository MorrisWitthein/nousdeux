package main

import (
	"time"
)

// Event mirrors the events table.
type Event struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Date            string    `json:"date,omitempty"`
	EndDate         string    `json:"endDate,omitempty"`
	Time            string    `json:"time,omitempty"`
	Who             string    `json:"who"`
	Badge           string    `json:"badge,omitempty"`
	BadgeType       string    `json:"badgeType,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	AttachmentCount int       `json:"attachmentCount"`
}

// EventSuggestion mirrors the event_suggestions table: an event one user
// proposes for the other to accept (creating a real event) or decline. Fields
// are listed in column order so RowToStructByPos can scan list queries.
type EventSuggestion struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Date        string     `json:"date,omitempty"`
	EndDate     string     `json:"endDate,omitempty"`
	Time        string     `json:"time,omitempty"`
	Badge       string     `json:"badge,omitempty"`
	BadgeType   string     `json:"badgeType,omitempty"`
	SuggestedBy string     `json:"suggestedBy"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	ResolvedAt  *time.Time `json:"resolvedAt,omitempty"`
	// Awaiting is whose turn it is, relative to SuggestedBy: "recipient" (the
	// non-suggester) or "sender" (the original suggester); empty once resolved.
	Awaiting string `json:"awaiting,omitempty"`
	// LastProposedBy is who made the currently-open proposal (the suggester, or
	// the other user after a counter-proposal).
	LastProposedBy string `json:"lastProposedBy,omitempty"`
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
	ImageURL    string    `json:"imageUrl,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// Series mirrors the series table.
type Series struct {
	ID           string    `json:"id"`
	Emoji        string    `json:"emoji,omitempty"`
	Title        string    `json:"title"`
	Sub          string    `json:"sub,omitempty"`
	Progress     int       `json:"progress"`
	Season       int       `json:"season"`
	TotalSeasons int       `json:"totalSeasons"`
	Status       string    `json:"status,omitempty"`
	StatusType   string    `json:"statusType,omitempty"`
	Who          string    `json:"who"`
	ImageURL     string    `json:"imageUrl,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// Movie mirrors the movies table.
type Movie struct {
	ID         string    `json:"id"`
	Emoji      string    `json:"emoji,omitempty"`
	Title      string    `json:"title"`
	Sub        string    `json:"sub,omitempty"`
	Genres     []string  `json:"genres,omitempty"`
	Status     string    `json:"status,omitempty"`
	StatusType string    `json:"statusType,omitempty"`
	Rating     int       `json:"rating"`
	Who        string    `json:"who"`
	ImageURL   string    `json:"imageUrl,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Attachment mirrors the event_attachments table.
type Attachment struct {
	ID          string    `json:"id"`
	EventID     string    `json:"eventId"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"contentType"`
	Size        int64     `json:"size"`
	UploadedBy  string    `json:"uploadedBy"`
	CreatedAt   time.Time `json:"created_at"`
}

// ShoppingItem mirrors the shopping_items table.
type ShoppingItem struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Qty       string    `json:"qty"`
	Checked   bool      `json:"checked"`
	Who       string    `json:"who"`
	CreatedAt time.Time `json:"created_at"`
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
	Status    string    `json:"status,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
