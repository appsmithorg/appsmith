package storage

import (
	"fmt"
	"log"

	"github.com/spf13/viper"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

type PostgresDataStore struct {
	Dbhost             string
	Dbport             string
	Dbuser             string
	Dbpass             string
	Dbname             string
	MaxOpenConnections int
	DB                 *gorm.DB
}

// InitPostgresDb initializes the database
func InitPostgresDb() (datastore DataStore, err error) {

	d := PostgresDataStore{}

	// Initialize the database
	d.dbConfig()

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s "+
		"password=%s dbname=%s sslmode=disable",
		d.Dbhost, d.Dbport,
		d.Dbuser, d.Dbpass, d.Dbname)

	d.DB, err = gorm.Open(viper.GetString("datastore.dialect"), psqlInfo)

	if err != nil {
		return nil, err
	}

	// Since the error returned from “Open” does not check if the datasource is valid calling
	// Ping on the database is required
	err = d.DB.DB().Ping()
	if err != nil {
		log.Fatal("Error: Could not establish a connection with the database")
	}

	// Setup connection pool
	d.DB.DB().SetMaxOpenConns(d.MaxOpenConnections)

	fmt.Println("Successfully connected!")
	d.DB.LogMode(true)
	return &d, nil
}

func (d *PostgresDataStore) dbConfig() {

	d.Dbhost = viper.GetString("datastore.host")
	if d.Dbhost == "" {
		d.Dbhost = "localhost"
	}
	d.Dbport = viper.GetString("datastore.port")
	if d.Dbport == "" {
		d.Dbport = "5432"
	}
	d.Dbuser = viper.GetString("datastore.user")
	if d.Dbuser == "" {
		d.Dbuser = "postgres"
	}
	d.Dbpass = viper.GetString("datastore.password")
	if d.Dbpass == "" {
		d.Dbpass = "root"
	}
	d.Dbname = viper.GetString("datastore.schema")
	if d.Dbname == "" {
		d.Dbname = "mobtools"
	}
	d.MaxOpenConnections = viper.GetInt("datastore.maxOpenConnections")
}

// ExecuteQuery executes the query on the DB
func (d *PostgresDataStore) ExecuteQuery(query string) ([]map[string]interface{}, error) {
	rows, err := d.DB.Raw(query).Rows()
	if err != nil {
		return nil, err
	}
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	values := make([]map[string]interface{}, 0)

	for rows.Next() {
		// Create a slice of interface{}'s to represent each column,
		// and a second slice to contain pointers to each item in the columns slice.
		columns := make([]interface{}, len(cols))
		columnPointers := make([]interface{}, len(cols))
		for i := range columns {
			columnPointers[i] = &columns[i]
		}

		// Scan the result into the column pointers...
		if err := rows.Scan(columnPointers...); err != nil {
			return nil, err
		}

		// Create our map, and retrieve the value for each column from the pointers slice,
		// storing it in the map with the name of the column as the key.
		m := make(map[string]interface{})
		for i, colName := range cols {
			val := columnPointers[i].(*interface{})
			m[colName] = *val
		}

		// Outputs: map[columnName:value columnName2:value2 columnName3:value3 ...]
		fmt.Println(m)
		values = append(values, m)
	}

	return values, nil
}

func (d *PostgresDataStore) GetDatastore() *gorm.DB {
	return d.DB
}
