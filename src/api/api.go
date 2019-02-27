// Package api contains all the handlers that the client will invoke on the middleware server
package api

import (
	"fmt"
	"net/http"
)

// HandleAPIError handles any error that bubbles up to the controller layer
// TODO: Make the error generic enough with HTTP status codes and messages as well
func HandleAPIError(w http.ResponseWriter, r *http.Request, err error) {
	// Write content-type, statuscode, payload
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(500)
	fmt.Fprintf(w, "%s", err)
}
