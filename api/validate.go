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

func validateEvent(e Event) error {
	if len(e.Title) > maxTitleLen {
		return fmt.Errorf("title exceeds %d characters", maxTitleLen)
	}
	if e.Date != "" && !reDate.MatchString(e.Date) {
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
