package storage

import (
	"fmt"
	"log"

	"github.com/jinzhu/gorm"
)

var StorageEngine DataStore

// DataStore defines the interface that all db implementations must implement.
type DataStore interface {
	ExecuteQuery(query string) ([]map[string]interface{}, error)
	GetDatastore() *gorm.DB
}

type DataStoreFactory func() (DataStore, error)

var datastoreFactories = make(map[string]DataStoreFactory)

// Constructor for the storage package
func init() {
	Register("postgres", InitPostgresDb)
}

// Register adds the DataStoreFactory against a name to the registry incase it's not present
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

// CreateDatastore initializes a datastore with connection pooling for a specific data storage name
// This name must have been registered with datastoreFactories when the storage package is initialized
func CreateDatastore(name string) (DataStore, error) {
	engine, ok := datastoreFactories[name]
	if !ok {
		return nil, fmt.Errorf("Invalid data store name: %s", name)
	}
	return engine()
}
