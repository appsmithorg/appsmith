package services

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"gitlab.com/mobtools/internal-tools-server/models"
	"gitlab.com/mobtools/internal-tools-server/storage"
)

// ExecuteQuery runs a custom SQL query on the client database
func ExecuteQuery(queryBody models.ExecQuery) ([]map[string]interface{}, error) {
	if queryBody.QueryType == "sql" {
		// Get the actual query from the DB
		datastore := storage.StorageEngine.GetDatastore()
		queryDAO := &models.Query{}

		if err := datastore.Where("name = ?", queryBody.Name).First(queryDAO).Error; gorm.IsRecordNotFoundError(err) {
			return nil, fmt.Errorf("Invalid queryName: %s provided", queryBody.Name)
		}

		queryStr := queryDAO.Executable
		mapArray, err := storage.StorageEngine.ExecuteQuery(queryStr)

		if err != nil {
			return nil, err
		}
		return mapArray, nil
	}

	return nil, fmt.Errorf("QueryType: %s not supported", queryBody.QueryType)
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
