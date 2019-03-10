package storage

// StorageType is the enum which defines the list of supported databases
type StorageType int

const (
	PostgresDb StorageType = iota
	MysqlDb
	MongoDb
)
