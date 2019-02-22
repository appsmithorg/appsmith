package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var db *sql.DB

const (
	dbhost = "DBHOST"
	dbport = "DBPORT"
	dbuser = "DBUSER"
	dbpass = "DBPASS"
	dbname = "DBNAME"
)

// InitDb initializes the database
func (d *GoFitDb) InitDb() {

	var err error

	// Initialize the database
	d.dbConfig()

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s "+
		"password=%s dbname=%s sslmode=disable",
		d.Dbhost, d.Dbport,
		d.Dbuser, d.Dbpass, d.Dbname)

	db, err = sql.Open("postgres", psqlInfo)

	if err != nil {
		panic(err)
	}
	// Setup connection pool
	db.SetMaxOpenConns(d.MaxOpenConnections)

	err = db.Ping()
	if err != nil {
		panic(err)
	}
	fmt.Println("Successfully connected!")
	listTables()
}

func (d *GoFitDb) dbConfig() {
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
		d.Dbname = "gofit"
	}
	d.MaxOpenConnections = 5
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
