package models

type (
	Component struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
		Type string `json:"type"`
	}
)
