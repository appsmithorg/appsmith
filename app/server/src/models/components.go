package models

import "time"

type (
	// TODO: Embed BaseModel into all the other components. The problem is the map -> struct
	// in utils.ConvertMapToStruct fxn

	BaseModel struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`
	}

	Component struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`

		Name          string `json:"name,omitempty" sql:"name"`
		ComponentType string `json:"component_type,omitempty" sql:"component_type"`
		Plan          string `json:"plan,omitempty" sql:"plan"`
	}

	Account struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`

		Name string `json:"name" sql:"name"`
	}

	User struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`

		Username string `json:"username" sql:"username"`
		Email    string `json:"email" sql:"email"`
	}

	Role struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`

		Name string `json:"name" sql:"name"`
	}

	Page struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`
	}
)
