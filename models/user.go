package models

import (
	"time"

	"github.com/markbates/goth"
)

type (
	User struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`

		Username string `json:"username" sql:"username"`
		Email    string `json:"email" sql:"email"`

		GothUser goth.User `json:"gothUser,omitempty"`
	}

	Role struct {
		ID        int64     `json:"id,omitempty" sql:"id"`
		CreatedAt time.Time `json:"created_at,omitempty" sql:"created_at"`
		UpdatedAt time.Time `json:"updated_at,omitempty" sql:"updated_at"`

		Name string `json:"name" sql:"name"`
	}
)
