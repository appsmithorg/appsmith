package api

// This file contains the APIs for component management

import (
	"encoding/json"
	"fmt"

	"net/http"

	"github.com/julienschmidt/httprouter"
	"gitlab.com/mobtools/internal-tools-server/models"
	"gitlab.com/mobtools/internal-tools-server/services"
)

// GetComponents fetches the list of components from the DB
func GetComponents(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	queryValues := r.URL.Query()

	components, err := services.GetComponent(queryValues)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	// Write content-type, statuscode, payload
	componentsJSON, _ := json.Marshal(components)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", componentsJSON)
}

// CreateComponents creates components in the DB
func CreateComponents(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	component := models.Component{}
	err := json.NewDecoder(r.Body).Decode(&component)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	component, err = services.CreateComponent(component)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	// Write content-type, statuscode, payload
	componentJSON, _ := json.Marshal(component)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", componentJSON)
}

func UpdateComponent(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	component := models.Component{}
	err := json.NewDecoder(r.Body).Decode(&component)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	component, err = services.UpdateComponent(component)
	if err != nil {
		HandleAPIError(w, r, err)
		return
	}

	// Write content-type, statuscode, payload
	componentJSON, _ := json.Marshal(component)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", componentJSON)
}
