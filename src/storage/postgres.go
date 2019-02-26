package storage

import (
	"fmt"
	"internal-tools-server/models"
	"log"
	"os"

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

const (
	dbhost = "DBHOST"
	dbport = "DBPORT"
	dbuser = "DBUSER"
	dbpass = "DBPASS"
	dbname = "DBNAME"
)

// InitPostgresDb initializes the database
func InitPostgresDb() (datastore DataStore, err error) {

	d := PostgresDataStore{}

	// Initialize the database
	d.dbConfig()

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s "+
		"password=%s dbname=%s sslmode=disable",
		d.Dbhost, d.Dbport,
		d.Dbuser, d.Dbpass, d.Dbname)

	d.DB, err = gorm.Open("postgres", psqlInfo)

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
	// listTables()
	return &d, nil
}

func (d *PostgresDataStore) dbConfig() {
	var ok bool
	d.Dbhost, ok = os.LookupEnv(dbhost)
	if !ok {
		d.Dbhost = "localhost"
	}
	d.Dbport, ok = os.LookupEnv(dbport)
	if !ok {
		d.Dbport = "5432"
	}
	d.Dbuser, ok = os.LookupEnv(dbuser)
	if !ok {
		d.Dbuser = "postgres"
	}
	d.Dbpass, ok = os.LookupEnv(dbpass)
	if !ok {
		d.Dbpass = "root"
	}
	d.Dbname, ok = os.LookupEnv(dbname)
	if !ok {
		d.Dbname = "mobtools"
	}
	d.MaxOpenConnections = 5
}

// ExecuteQuery executes the query on the DB
func (d *PostgresDataStore) ExecuteQuery(query string) ([]models.Component, error) {
	rows, err := d.DB.Raw(query).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	components := []models.Component{}

	for rows.Next() {
		component := models.Component{}
		err = rows.Scan(
			&component.ID,
			&component.Name,
			&component.Type,
		)
		components = append(components, component)
	}

	return components, nil
}

func (d *PostgresDataStore) GetDatastore() *gorm.DB {
	return d.DB
}
