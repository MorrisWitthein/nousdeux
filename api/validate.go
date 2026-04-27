package main

import (
	"fmt"
	"regexp"
)

var (
	reDate = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	reTime = regexp.MustCompile(`^\d{2}:\d{2}$`)
)

const maxTitleLen = 255

func validateRecipe(r Recipe) error {
	if len(r.Title) > maxTitleLen {
		return fmt.Errorf("title exceeds %d characters", maxTitleLen)
	}
	if r.Rating < 0 || r.Rating > 5 {
		return fmt.Errorf("rating must be between 0 and 5")
	}
	if r.PrepTime != nil && *r.PrepTime < 0 {
		return fmt.Errorf("prepTime must be >= 0")
	}
	if r.Servings != nil && *r.Servings < 1 {
		return fmt.Errorf("servings must be >= 1")
	}
	return nil
}

func validateSeries(s Series) error {
	if len(s.Title) > maxTitleLen {
		return fmt.Errorf("title exceeds %d characters", maxTitleLen)
	}
	if s.Season < 0 || s.Season > 50 {
		return fmt.Errorf("season must be between 0 and 50")
	}
	if s.StatusType != "" {
		switch s.StatusType {
		case "green", "yellow", "red":
		default:
			return fmt.Errorf("statusType must be one of: green, yellow, red")
		}
	}
	return nil
}

func validateMovie(m Movie) error {
	if len(m.Title) > maxTitleLen {
		return fmt.Errorf("title exceeds %d characters", maxTitleLen)
	}
	if m.StatusType != "" {
		switch m.StatusType {
		case "green", "yellow", "red":
		default:
			return fmt.Errorf("statusType must be one of: green, yellow, red")
		}
	}
	return nil
}

func validateActivity(a Activity) error {
	if len(a.Title) > maxTitleLen {
		return fmt.Errorf("title exceeds %d characters", maxTitleLen)
	}
	if a.Date != "" && !reDate.MatchString(a.Date) {
		return fmt.Errorf("date must be YYYY-MM-DD")
	}
	if a.Time != "" && !reTime.MatchString(a.Time) {
		return fmt.Errorf("time must be HH:MM")
	}
	if a.Status != "" {
		switch a.Status {
		case "Idee", "Geplant", "Gemacht":
		default:
			return fmt.Errorf("status must be one of: Idee, Geplant, Gemacht")
		}
	}
	return nil
}

func validateEvent(e Event) error {
	if len(e.Title) > maxTitleLen {
		return fmt.Errorf("title exceeds %d characters", maxTitleLen)
	}
	if e.Date == "" {
		return fmt.Errorf("date is required")
	}
	if !reDate.MatchString(e.Date) {
		return fmt.Errorf("date must be YYYY-MM-DD")
	}
	if e.EndDate != "" && !reDate.MatchString(e.EndDate) {
		return fmt.Errorf("endDate must be YYYY-MM-DD")
	}
	if e.Date != "" && e.EndDate != "" && e.EndDate <= e.Date {
		return fmt.Errorf("endDate must be strictly after date")
	}
	if e.Time != "" && !reTime.MatchString(e.Time) {
		return fmt.Errorf("time must be HH:MM")
	}
	if e.BadgeType != "" {
		switch e.BadgeType {
		case "green", "yellow", "red":
		default:
			return fmt.Errorf("badgeType must be one of: green, yellow, red")
		}
	}
	return nil
}
