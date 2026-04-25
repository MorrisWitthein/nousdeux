package main

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

const weatherTTL = 2 * time.Hour

var weatherCache struct {
	mu      sync.Mutex
	emoji   string
	expires time.Time
}

func wmoToEmoji(code int, isDay bool) string {
	switch {
	case code == 0:
		if isDay {
			return "☀️"
		}
		return "🌙"
	case code <= 2:
		return "🌤️"
	case code == 3:
		return "☁️"
	case code <= 48:
		return "🌫️"
	case code <= 55:
		return "🌦️"
	case code <= 67:
		return "🌧️"
	case code <= 77:
		return "❄️"
	case code <= 82:
		return "🌧️"
	case code <= 86:
		return "🌨️"
	default:
		return "⛈️"
	}
}

func handleWeather(w http.ResponseWriter, r *http.Request) {
	weatherCache.mu.Lock()
	defer weatherCache.mu.Unlock()

	if time.Now().Before(weatherCache.expires) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"emoji": weatherCache.emoji})
		return
	}

	resp, err := http.Get("https://api.open-meteo.com/v1/forecast?latitude=53.5753&longitude=10.0153&current=weather_code,is_day")
	if err != nil {
		http.Error(w, "weather fetch failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	var result struct {
		Current struct {
			WeatherCode int `json:"weather_code"`
			IsDay       int `json:"is_day"`
		} `json:"current"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, "weather parse failed", http.StatusInternalServerError)
		return
	}

	emoji := wmoToEmoji(result.Current.WeatherCode, result.Current.IsDay == 1)
	weatherCache.emoji = emoji
	weatherCache.expires = time.Now().Add(weatherTTL)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"emoji": emoji})
}
