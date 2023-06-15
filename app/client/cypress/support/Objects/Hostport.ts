export class DefaultHostPort {
  mongo_authenticationAuthtype = "SCRAM-SHA-1";
  mongo_host = "host.docker.internal";
  mongo_port = 28017;
  mongo_databaseName = "mongo_samples";
  mongo_uri =
    "mongodb+srv://localhost:localhost@mockdb.net/mock?retryWrites=true&w=majority";

  postgres_host = "host.docker.internal";
  postgres_port = 5432;
  postgres_databaseName = "fakeapi";
  postgres_username = "docker";
  postgres_password = "docker";

  mysql_host = "host.docker.internal";
  mysql_port = 3306;
  mysql_databaseName = "fakeapi";
  mysql_username = "root";
  mysql_password = "root";

  mssql_host = "host.docker.internal";
  mssql_port = 1433;
  mssql_databaseName = "fakeapi";
  mssql_username = "SA";
  mssql_password = "Root@123";

  arango_host = "host.docker.internal";
  arango_port = 8529;
  arango_databaseName = "_system";
  arango_username = "root";
  arango_password = "Arango";

  elastic_host = "http://host.docker.internal";
  elastic_port = 9200;
  elastic_username = "elastic";
  elastic_password = "docker";

  redshift_host = "localhost";
  redshift_port = 543;
  redshift_databaseName = "fakeapi";
  redshift_username = "root";
  redshift_password = "Redshift$123";

  smtp_host = "host.docker.internal";
  smtp_port = "25";
  smtp_username = "root";
  smtp_password = "root";

  oracle_host = "random-data";
  oracle_port = 40;
  oracle_name = "random-name";
  oracle_username = "random-username";
  oracle_password = "random-password";

  redis_host = "host.docker.internal";
  redis_port = "6379";

  OAuth_Username = "testuser@appsmith.com";
  OAuth_Host = "http://localhost:6001";
  OAuth_ApiUrl = "http://host.docker.internal:6001";
  OAUth_AccessTokenUrl = "http://host.docker.internal:6001/oauth/token";
  OAuth_AuthUrl = "http://localhost:6001/oauth/authorize";
  OAuth_RedirectUrl = "http://localhost/api/v1/datasources/authorize";

  AirtableBase = "appubHrVbovcudwN6";
  AirtableTable = "tblsFCQSskVFf7xNd";

  mockApiUrl = "http://host.docker.internal:5001/v1/mock-api?records=10";
  echoApiUrl = "http://host.docker.internal:5001/v1/mock-api/echo";
  randomCatfactUrl = "http://host.docker.internal:5001/v1/catfact/random";

  firestore_database_url = "https://appsmith-22e8b.firebaseio.com";
  firestore_projectID = "appsmith-22e8b";

  restapi_url = "https://my-json-server.typicode.com/typicode/demo/posts";
  connection_type = "Replica set";

  mockHostAddress = "fake_api.cvuydmurdlas.us-east-1.rds.amazonaws.com";
  mockDatabaseName = "fakeapi";
  mockDatabaseUsername = "fakeapi";
  mockDatabasePassword = "LimitedAccess123#";
  readonly = "readonly";
  authenticatedApiUrl = "https://fakeapi.com";

  GraphqlApiUrl_TED = "http://host.docker.internal:5000/graphql";
  GITEA_API_BASE_TED = "localhost";
  GITEA_API_PORT_TED = "3001";
  GITEA_API_URL_TED = "git@host.docker.internal:Cypress";
}
