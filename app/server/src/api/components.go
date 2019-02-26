package api

// This file contains the APIs for component management

import (
	"encoding/json"
	"fmt"
	"internal-tools-server/storage"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// GetComponents fetches the list of components from the DB
func GetComponents(w http.ResponseWriter, r *http.Request, params httprouter.Params) {

	components, _ := storage.StorageEngine.ExecuteQuery("select * from components")

	componentsJSON, _ := json.Marshal(components)

	// Write content-type, statuscode, payload
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	fmt.Fprintf(w, "%s", componentsJSON)
}
