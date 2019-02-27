package main

import (
	"internal-tools-server/api"
	"internal-tools-server/models"
	"internal-tools-server/storage"
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

const baseURL = "/api"
const apiVersion = "/v1"

func main() {
	// Initialize the database
	var err error
	storage.StorageEngine, err = storage.CreateDatastore("postgres")
	if err != nil {
		log.Fatalln("Exception while creating datastore")
	}

	runMigrations()

	router := httprouter.New()

	// Account CRUD Endpoints

	// Component CRUD Endpoints
	router.GET(baseURL+apiVersion+"/components", api.GetComponents)
	router.POST(baseURL+apiVersion+"/components", api.CreateComponents)
	router.PUT(baseURL+apiVersion+"/components", api.UpdateComponent)

	// Page CRUD Endpoints

	// Query CRUD Endpoints

	log.Fatal(http.ListenAndServe(":8000", router))
}

func runMigrations() {
	log.Println("Going to run migrations")
	storage.StorageEngine.GetDatastore().AutoMigrate(
		&models.Component{},
		&models.Account{},
		&models.User{},
		&models.Role{},
		&models.Page{},
	)
	log.Println("Successfully run all migrations")
}
