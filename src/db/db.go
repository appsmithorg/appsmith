package db

// QueryInterface defines the interface that all db implementations must implement.
type QueryInterface interface {
	ExecuteQuery()
}

// ConnectionInterface defines the interface that all db implementations must implement.
type ConnectionInterface interface {
	InitDb()
}

type GoFitDb struct {
	Dbhost             string
	Dbport             string
	Dbuser             string
	Dbpass             string
	Dbname             string
	MaxOpenConnections int
}
