// Package api contains all the handlers that the client will invoke on the middleware server
package api

import (
	"fmt"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func IndexHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprintf(w, string("hello there"))
}

func TableHandler(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	tableName := params.ByName("name")
	fmt.Fprintf(w, "hello %s", tableName)
}
