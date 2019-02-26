package storage

import (
	"database/sql"
	"fmt"
	"internal-tools-server/models"
	"log"

	"github.com/jinzhu/gorm"
)

var db *sql.DB

var StorageEngine DataStore

// DataStore defines the interface that all db implementations must implement.
type DataStore interface {
	ExecuteQuery(query string) ([]models.Component, error)
	GetDatastore() *gorm.DB
}

type DataStoreFactory func() (DataStore, error)

var datastoreFactories = make(map[string]DataStoreFactory)

func Register(name string, factory DataStoreFactory) {
	if factory == nil {
		log.Panicf("Datastore factory %s does not exist.", name)
	}
	_, registered := datastoreFactories[name]
	if registered {
		log.Printf("Datastore factory %s already registered. Ignoring.", name)
	}
	datastoreFactories[name] = factory
}

func init() {
	Register("postgres", InitPostgresDb)
}

func CreateDatastore(name string) (DataStore, error) {
	engine, ok := datastoreFactories[name]
	if !ok {
		return nil, fmt.Errorf("Invalid data store name: %s", name)
	}
	return engine()
}
