package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"gitlab.com/mobtools/internal-tools-server/models"
	"gitlab.com/mobtools/internal-tools-server/services"
)

/*
 This file contains the APIs for the client to invoke in order to fetch data or perform an action
 on the middleware server
*/

// PostQuery executes a custom sql query on the client database
func PostQuery(w http.ResponseWriter, r *http.Request) {
	queryBody := models.ExecQuery{}
	err := json.NewDecoder(r.Body).Decode(&queryBody)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	var mapArray []map[string]interface{}
	mapArray, err = services.ExecuteQuery(queryBody)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	// Write content-type, statuscode, payload
	mapJSON, _ := json.Marshal(mapArray)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", mapJSON)
}

// CreateQuery creates a new query for the user in the table
func CreateQuery(w http.ResponseWriter, r *http.Request) {
	queryBody := models.Query{}
	err := json.NewDecoder(r.Body).Decode(&queryBody)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	queryBody, err = services.CreateQuery(queryBody)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	// Write content-type, statuscode, payload
	queryJSON, _ := json.Marshal(queryBody)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", queryJSON)
}

// UpdateQuery updates a given query in the database for a given account
func UpdateQuery(w http.ResponseWriter, r *http.Request) {
	queryBody := models.Query{}
	err := json.NewDecoder(r.Body).Decode(&queryBody)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	queryBody, err = services.UpdateQuery(queryBody)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	// Write content-type, statuscode, payload
	queryJSON, _ := json.Marshal(queryBody)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", queryJSON)
}
