package db

// QueryInterface defines the interface that all db implementations must implement.
type QueryInterface interface {
	ExecuteQuery()
}

// ConnectionInterface defines the interface that all db implementations must implement.
type ConnectionInterface interface {
	InitDb() error
}

type jdbcDb struct {
	Dbhost             string
	Dbport             string
	Dbuser             string
	Dbpass             string
	Dbname             string
	MaxOpenConnections int
}

type postgresDb jdbcDb

// NewDb returns an instance of the type of database that must be instantiated. For each new database type
// it must implement the ConnectionInterface and the QueryInterface
func NewDb(storageType StorageType) ConnectionInterface {
	switch storageType {
	case PostgresDb:
		return &postgresDb{}
	default:
		return nil
	}
}
