package main

import (
	"internal-tools-server/api"
	"internal-tools-server/db"
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func main() {
	db := db.NewDb(db.PostgresDb)
	db.InitDb()

	router := httprouter.New()

	router.GET("/api/index", api.IndexHandler)
	router.GET("/api/table/:name", api.TableHandler)

	log.Fatal(http.ListenAndServe(":8000", router))
}
