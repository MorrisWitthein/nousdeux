package main

// Event mirrors the DB schema from PLAN.md.
type Event struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Date      string `json:"date,omitempty"`
	Time      string `json:"time,omitempty"`
	Who       string `json:"who"`
	Badge     string `json:"badge,omitempty"`
	BadgeType string `json:"badgeType,omitempty"`
	CreatedAt string `json:"created_at"`
}

// Recipe mirrors the DB schema from PLAN.md.
type Recipe struct {
	ID        string   `json:"id"`
	Emoji     string   `json:"emoji,omitempty"`
	Title     string   `json:"title"`
	Tags      []string `json:"tags,omitempty"`
	Who       string   `json:"who"`
	Rating    string   `json:"rating,omitempty"`
	CreatedAt string   `json:"created_at"`
}

// Series mirrors the DB schema from PLAN.md.
type Series struct {
	ID         string `json:"id"`
	Emoji      string `json:"emoji,omitempty"`
	Title      string `json:"title"`
	Sub        string `json:"sub,omitempty"`
	Progress   int    `json:"progress"`
	Status     string `json:"status,omitempty"`
	StatusType string `json:"statusType,omitempty"`
	CreatedAt  string `json:"created_at"`
}

// Activity mirrors the DB schema from PLAN.md.
type Activity struct {
	ID        string `json:"id"`
	Emoji     string `json:"emoji,omitempty"`
	Title     string `json:"title"`
	Meta      string `json:"meta,omitempty"`
	Who       string `json:"who"`
	CreatedAt string `json:"created_at"`
}
