// Package api contains all the handlers that the client will invoke on the middleware server
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type ApiError struct {
	Code int64  `json:"code,omitempty"`
	Msg  string `json:"msg,omitempty"`
}

// HandleAPIError handles any error that bubbles up to the controller layer
// TODO: Make the error generic enough with HTTP status codes and messages as well
func HandleAPIError(w http.ResponseWriter, r *http.Request, err error) {
	// Write content-type, statuscode, payload
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(500)
	fmt.Fprintf(w, "%s", createErrorBody(err))
}

func createErrorBody(err error) []byte {
	apiError := ApiError{
		Code: -1,
		Msg:  err.Error(),
	}

	errorJSON, _ := json.Marshal(apiError)
	return errorJSON
}
