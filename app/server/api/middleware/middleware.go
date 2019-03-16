package middleware

import (
	"log"
	"net/http"
	"time"

	"github.com/markbates/goth/gothic"
)

type Middleware func(http.HandlerFunc) http.HandlerFunc

// Logging logs all requests with its path and the time it took to process
func Logging() Middleware {

	// Create a new Middleware
	return func(f http.HandlerFunc) http.HandlerFunc {

		// Define the http.HandlerFunc
		return func(w http.ResponseWriter, r *http.Request) {

			// Do middleware things
			start := time.Now()
			defer func() { log.Println(r.URL.Path, time.Since(start)) }()

			// Call the next middleware/handler in chain
			f(w, r)
		}
	}
}

func Authenticated() Middleware {

	// Create a new Middleware
	return func(f http.HandlerFunc) http.HandlerFunc {

		// Define the http.HandlerFunc
		return func(w http.ResponseWriter, r *http.Request) {
			sess, err := gothic.GetFromSession("google", r)
			if err != nil {
				// Write an error and stop the handler chain
				http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
				return
			}

			log.Printf("Got the authenticated user: %s", sess)

			f(w, r)
		}
	}

}

// Chain applies middlewares to a http.HandlerFunc
func Chain(f http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
	for _, m := range middlewares {
		f = m(f)
	}
	return f
}
