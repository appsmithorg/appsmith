package storage

import (
	"database/sql"
	"fmt"
	"internal-tools-server/models"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type PostgresDataStore struct {
	Dbhost             string
	Dbport             string
	Dbuser             string
	Dbpass             string
	Dbname             string
	MaxOpenConnections int
	db                 *sql.DB
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

	d.db, err = sql.Open("postgres", psqlInfo)

	if err != nil {
		return nil, err
	}

	// Since the error returned from “Open” does not check if the datasource is valid calling
	// Ping on the database is required
	err = d.db.Ping()
	if err != nil {
		log.Fatal("Error: Could not establish a connection with the database")
	}

	// Setup connection pool
	d.db.SetMaxOpenConns(d.MaxOpenConnections)

	err = d.db.Ping()
	if err != nil {
		return nil, err
	}
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
	rows, err := d.db.Query(query)
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

type schemaSummary struct {
	tableName string
}

// listTables first fetches the tables from the db
func listTables() error {
	tables := []schemaSummary{}

	rows, err := db.Query(`
		SELECT table_name as tableName FROM information_schema.tables WHERE table_schema='public'; `)
	if err != nil {
		return err
	}

	defer rows.Close()
	for rows.Next() {
		schema := schemaSummary{}
		err = rows.Scan(
			&schema.tableName,
		)
		fmt.Printf("Name: %s\n", schema.tableName)
		if err != nil {
			return err
		}
		tables = append(tables, schema)
	}
	err = rows.Err()
	if err != nil {
		return err
	}
	fmt.Printf("\nTables: %x\n", tables)
	return nil
}
