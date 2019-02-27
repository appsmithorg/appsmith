package models

type (
	Component struct {
		ID   int64  `json:"id,omitempty" sql:"id"`
		Name string `json:"name,omitempty" sql:"name"`
		Type string `json:"type,omitempty" sql:"type"`
		Plan string `json:"plan,omitempty" sql:"plan"`
	}
)
