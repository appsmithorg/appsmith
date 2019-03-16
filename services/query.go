package services

import (
	"fmt"
	"log"

	"github.com/cbroglie/mustache"
	"github.com/jinzhu/gorm"
	"gitlab.com/mobtools/internal-tools-server/models"
	"gitlab.com/mobtools/internal-tools-server/storage"
)

// ExecuteQuery runs a custom SQL query on the client database
func ExecuteQuery(queryBody models.ExecQuery) ([]map[string]interface{}, error) {
	datastore := storage.StorageEngine.GetDatastore()
	queryDAO := &models.Query{}

	if err := datastore.Where("name = ?", queryBody.Name).First(queryDAO).Error; gorm.IsRecordNotFoundError(err) {
		return nil, fmt.Errorf("Invalid queryName: %s provided", queryBody.Name)
	}

	//TODO: Move to a factory method for better readability
	if queryDAO.QueryType == "sql" {
		// Get the actual query from the DB
		queryStr := queryDAO.Executable

		// Extract the key-value pairs from the request
		templateKeyValue := make(map[string]string)
		if len(queryBody.Params.QueryParams) > 0 {
			for _, elem := range queryBody.Params.QueryParams {
				templateKeyValue[elem.Key] = elem.Value
			}
		}

		// Substitute it in the template string
		log.Printf("Going to parse string: %s", queryStr)
		renderedStr, err := mustache.Render(queryStr, templateKeyValue)
		if err != nil {
			log.Printf("Error while parsing the mustache template. %s", err.Error())
			return nil, err
		}

		mapArray, err := storage.StorageEngine.ExecuteQuery(renderedStr)
		if err != nil {
			return nil, err
		}
		return mapArray, nil
	}

	return nil, fmt.Errorf("QueryType: %s not supported", queryDAO.QueryType)
}

// CreateQuery creates a new query that can be executed by name at runtime
func CreateQuery(queryBody models.Query) (models.Query, error) {
	datastore := storage.StorageEngine.GetDatastore()
	if err := datastore.Create(&queryBody).Error; err != nil {
		return models.Query{}, err
	}

	return queryBody, nil
}

// UpdateQuery updates an existing query in the database
func UpdateQuery(query models.Query) (models.Query, error) {
	datastore := storage.StorageEngine.GetDatastore()

	// Update only the non-nil values in the struct
	datastore.Model(&query).Updates(query)

	// Select the updated record to return back to the client
	datastore.First(&query)
	return query, nil
}
