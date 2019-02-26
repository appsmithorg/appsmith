package main

import (
	"internal-tools-server/api"
	"internal-tools-server/storage"
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func main() {
	// Initialize the database
	var err error
	storage.StorageEngine, err = storage.CreateDatastore("postgres")
	if err != nil {
		log.Fatalln("Exception while creating datastore")
	}

	router := httprouter.New()

	// Account CRUD Endpoints

	// Component CRUD Endpoints
	router.GET("/api/v1/components", api.GetComponents)

	// Page CRUD Endpoints

	// Query CRUD Endpoints

	log.Fatal(http.ListenAndServe(":8000", router))
}
