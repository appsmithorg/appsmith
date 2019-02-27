package services

import (
	"fmt"
	"internal-tools-server/models"
	"internal-tools-server/storage"
	"internal-tools-server/utils"
)

// GetComponent fetches a list of components from the DB based a particular user's plan
// TODO: Also check for a user's plan
func GetComponent(values map[string][]string) ([]models.Component, error) {
	var mapArray []map[string]interface{}
	var components []models.Component
	var err error
	mapArray, err = storage.StorageEngine.ExecuteQuery("select * from components")

	// Convert the map into an array of objects
	for _, m := range mapArray {
		var component models.Component
		err = utils.ConvertMapToStruct(&component, component, m)
		if err != nil {
			return nil, fmt.Errorf("Found error while converting the map to struct", err)
		}
		components = append(components, component)
	}

	return components, nil
}

// CreateComponent creates a new component in the DB
func CreateComponent(component models.Component) (models.Component, error) {
	datastore := storage.StorageEngine.GetDatastore()
	datastore.Create(&component)
	return component, nil
}

// UpdateComponent updates an existing component in the DB
func UpdateComponent(component models.Component) (models.Component, error) {
	datastore := storage.StorageEngine.GetDatastore()

	// Update only the non-nil values in the struct
	datastore.Model(&component).Updates(component)

	// Select the updated record to return back to the client
	datastore.First(&component)
	return component, nil
}
