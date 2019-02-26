package api

// This file contains the APIs for component management

import (
	"encoding/json"
	"fmt"
	"internal-tools-server/models"
	"internal-tools-server/storage"
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// GetComponents fetches the list of components from the DB
func GetComponents(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	queryValues := r.URL.Query()
	log.Println(queryValues["type"])
	components, _ := storage.StorageEngine.ExecuteQuery("select * from components")

	componentsJSON, _ := json.Marshal(components)

	// Write content-type, statuscode, payload
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", componentsJSON)
}

// CreateComponents creates components in the DB
func CreateComponents(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	component := models.Component{}
	err := json.NewDecoder(r.Body).Decode(&component)
	if err != nil {
		fmt.Errorf("Error caught while parsing component body")
	}

	datastore := storage.StorageEngine.GetDatastore()
	datastore.Create(&component)

	// TODO: Create the component in the DB here
	// Write content-type, statuscode, payload
	componentJSON, _ := json.Marshal(component)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", componentJSON)
}
