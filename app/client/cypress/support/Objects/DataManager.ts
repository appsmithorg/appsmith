export class DataManager {
  environments = ["Production", "Staging"];
  defaultEnviorment = this.environments[0];

  GIT_API_BASE = "localhost:4200";
  GIT_CLONE_URL = "git@host.docker.internal:Cypress";

  dsValues: Record<string, any> = {
    Production: {
      mongo_authenticationAuthtype: "SCRAM-SHA-1",
      mongo_host: "host.docker.internal",
      mongo_port: 28017,
      mongo_databaseName: "mongo_prod",

      postgres_host: "host.docker.internal",
      postgres_port: 5433,
      postgres_databaseName: "fakeapi",
      postgres_username: "docker",
      postgres_password: "docker",

      mysql_host: "host.docker.internal",
      mysql_port: 3306,
      mysql_databaseName: "fakeapi",
      mysql_username: "root",
      mysql_password: "root",

      mssql_host: "host.docker.internal",
      mssql_port: 1433,
      mssql_databaseName: "fakeapi",
      mssql_username: "SA",
      mssql_password: "Root@123",

      arango_host: "host.docker.internal",
      arango_port: 8529,
      arango_databaseName: "_system",
      arango_username: "root",
      arango_password: "Arango",

      elastic_host: "http://host.docker.internal",
      elastic_port: 9200,
      elastic_username: "elastic",
      elastic_password: "docker",

      redshift_host: "localhost",
      redshift_port: 543,
      redshift_databaseName: "fakeapi",
      redshift_username: "root",
      redshift_password: "Redshift$123",

      smtp_host: "host.docker.internal",
      smtp_port: "25",
      smtp_username: "root",
      smtp_password: "root",

      oracle_host: Cypress.env("ORACLE_HOST"),
      oracle_port: 1521,
      oracle_service: Cypress.env("ORACLE_SERVICE"),
      oracle_username: Cypress.env("ORACLE_USERNAME"),
      oracle_password: Cypress.env("ORACLE_PASSWORD"),

      redis_host: "host.docker.internal",
      redis_port: "6379",

      OAuth_Username: "testuser@appsmith.com",
      OAuth_Host: "http://localhost:6001",
      OAuth_ApiUrl: "http://host.docker.internal:6001",
      OAUth_AccessTokenUrl: "http://host.docker.internal:6001/oauth/token",
      OAuth_AuthUrl: "http://localhost:6001/oauth/authorize",
      OAuth_RedirectUrl: "http://localhost/api/v1/datasources/authorize",

      AirtableBase: "appubHrVbovcudwN6",
      AirtableTable: "tblsFCQSskVFf7xNd",

      mockApiUrl: "http://host.docker.internal:5001/v1/mock-api?records=10",
      mockGenderAge:
        "http://host.docker.internal:5001/v1/genderize_agify?name=",
      mockGzipApi: "http://host.docker.internal:5001/v1/gzip",

      mockApiObjectUrl:
        "http://host.docker.internal:5001/v1/mock-api-object?records=10",
      echoApiUrl: "http://host.docker.internal:5001/v1/mock-api/echo",
      randomCatfactUrl: "http://host.docker.internal:5001/v1/catfact/random",
      multipartAPI:
        "http://host.docker.internal:5001/v1/mock-api/echo-multipart",
      randomTrumpApi:
        "http://host.docker.internal:5001/v1/whatdoestrumpthink/random",
      mockHttpCodeUrl: "http://host.docker.internal:5001/v1/mock-http-codes/",
      flowerImageUrl1:
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
      flowerImageUrl2:
        "http://host.docker.internal:4200/photo-1492529029602-33e53698f407.jpeg",
      AirtableBaseForME: "appubHrVbovcudwN6",
      AirtableTableForME: "tblsFCQSskVFf7xNd",
      ApiUrlME: "http://host.docker.internal:5001/v1/production",

      firestore_database_url: "https://appsmith-22e8b.firebaseio.com",
      firestore_projectID: "appsmith-22e8b",
      firestore_serviceaccountkey: Cypress.env("FIRESTORE_PRIVATE_KEY"),

      mockHostAddress: "fake_api.cvuydmurdlas.us-east-1.rds.amazonaws.com",
      mockDatabaseName: "fakeapi",
      mockDatabaseUsername: "fakeapi",
      mockDatabasePassword: "LimitedAccess123#",
      readonly: "readonly",
      authenticatedApiUrl: "http://host.docker.internal:5001",

      GraphqlApiUrl_TED: "http://host.docker.internal:4200/graphql",

      twilio_username: "random-username",
      twilio_password: "random-password",

      Snowflake_accountName: Cypress.env("SNOWFLAKE_ACCOUNT_NAME"),
      Snowflake_warehouseName: "COMPUTE_WH",
      Snowflake_databaseName: "TESTDB",
      Snowflake_defaultSchema: "PUBLIC",
      Snowflake_role: "SYSADMIN",
      Snowflake_username: Cypress.env("SNOWFLAKE_USERNAME"),
      Snowflake_password: Cypress.env("SNOWFLAKE_PASSWORD"),

      hubspotBearerToken: Cypress.env("HUBSPOT_TOKEN"),
    },

    Staging: {
      mongo_authenticationAuthtype: "SCRAM-SHA-1",
      mongo_host: "host.docker.internal",
      mongo_port: 28017,
      mongo_databaseName: "mongo_staging",

      postgres_host: "host.docker.internal",
      postgres_port: 5433,
      postgres_databaseName: "stagingdb",
      postgres_username: "dockerstaging",
      postgres_password: "dockerstaging",

      mysql_host: "host.docker.internal",
      mysql_port: 3306,
      mysql_databaseName: "fakeapi",
      mysql_username: "root",
      mysql_password: "root",

      mssql_host: "host.docker.internal",
      mssql_port: 1433,
      mssql_databaseName: "fakeapi",
      mssql_username: "SA",
      mssql_password: "Root@123",

      arango_host: "host.docker.internal",
      arango_port: 8529,
      arango_databaseName: "_system",
      arango_username: "root",
      arango_password: "Arango",

      elastic_host: "http://host.docker.internal",
      elastic_port: 9200,
      elastic_username: "elastic",
      elastic_password: "docker",

      redshift_host: "localhost",
      redshift_port: 543,
      redshift_databaseName: "fakeapi",
      redshift_username: "root",
      redshift_password: "Redshift$123",

      smtp_host: "host.docker.internal",
      smtp_port: "25",
      smtp_username: "root",
      smtp_password: "root",

      oracle_host: "random-data",
      oracle_port: 40,
      oracle_service: "random-name",
      oracle_username: "random-username",
      oracle_password: "random-password",

      redis_host: "host.docker.internal",
      redis_port: "6379",

      OAuth_Username: "testuser@appsmith.com",
      OAuth_Host: "http://localhost:6001",
      OAuth_ApiUrl: "http://host.docker.internal:6001",
      OAUth_AccessTokenUrl: "http://host.docker.internal:6001/oauth/token",
      OAuth_AuthUrl: "http://localhost:6001/oauth/authorize",
      OAuth_RedirectUrl: "http://localhost/api/v1/datasources/authorize",

      AirtableBase: "appubHrVbovcudwN6",
      AirtableTable: "tblsFCQSskVFf7xNd",

      mockApiUrl: "http://host.docker.internal:5001/v1/mock-api?records=10",
      echoApiUrl: "http://host.docker.internal:5001/v1/mock-api/echo",
      randomCatfactUrl: "http://host.docker.internal:5001/v1/catfact/random",
      multipartAPI:
        "http://host.docker.internal:5001/v1/mock-api/echo-multipart",
      mockHttpCodeUrl: "http://host.docker.internal:5001/v1/mock-http-codes/",
      AirtableBaseForME: "appubHrVbovcudwN6",
      AirtableTableForME: "tblsFCQSskVFf7xNd",
      ApiUrlME: "http://host.docker.internal:5001/v1/staging",

      firestore_database_url: "https://staging-sample.firebaseio.com",
      firestore_projectID: "appsmith-dummy",
      firestore_serviceaccountkey: "dummy_service_creds_key",

      mockHostAddress: "fake_api.cvuydmurdlas.us-east-1.rds.amazonaws.com",
      mockDatabaseName: "fakeapi",
      mockDatabaseUsername: "fakeapi",
      mockDatabasePassword: "LimitedAccess123#",
      readonly: "readonly",
      authenticatedApiUrl: "http://host.docker.internal:5001",

      GraphqlApiUrl_TED: "http://host.docker.internal:4200/graphql",

      twilio_username: "random-username",
      twilio_password: "random-password",

      Snowflake_accountName: Cypress.env("SNOWFLAKE_ACCOUNT_NAME"),
      Snowflake_warehouseName: "COMPUTE_WH",
      Snowflake_databaseName: "TESTDB",
      Snowflake_defaultSchema: "PUBLIC",
      Snowflake_role: "SYSADMIN",
      Snowflake_username: Cypress.env("SNOWFLAKE_USERNAME"),
      Snowflake_password: Cypress.env("SNOWFLAKE_PASSWORD"),

      hubspotBearerToken: Cypress.env("HUBSPOT_TOKEN"),
    },
  };

  paginationUrl = (records = 20, page = 4, size = 3) => {
    return `http://host.docker.internal:5001/v1/mock-api?records=${records}&page=${page}&size=${size}`;
  };

  mongo_uri = (environment = this.defaultEnviorment) => {
    return `mongodb://${this.dsValues[environment].mongo_host}:${this.dsValues[environment].mongo_port}/${this.dsValues[environment].mongo_databaseName}`;
  };
  mssql_docker = (
    containerName: string,
    environment = this.defaultEnviorment,
  ) => {
    return `docker run --name=${containerName} -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=${
      this.dsValues[environment].mssql_password
    }" -p ${this.dsValues[environment].mssql_port.toString()}:${this.dsValues[
      environment
    ].mssql_port.toString()} -d mcr.microsoft.com/azure-sql-edge`;
  };

  arango_docker = (
    containerName: string,
    environment = this.defaultEnviorment,
  ) => {
    return `docker run --name ${containerName} -e ARANGO_USERNAME=${
      this.dsValues[environment].arango_username
    } -e ARANGO_ROOT_PASSWORD=${
      this.dsValues[environment].arango_password
    } -p ${this.dsValues[environment].arango_port.toString()}:${this.dsValues[
      environment
    ].arango_port.toString()} -d arangodb`;
  };

  elastic_docker = (
    containerName: string,
    environment = this.defaultEnviorment,
  ) => {
    return `docker run --name ${containerName} -d -p ${this.dsValues[
      environment
    ].elastic_port.toString()}:${this.dsValues[
      environment
    ].elastic_port.toString()} -e "discovery.type=single-node" -e "ELASTIC_USERNAME=${
      this.dsValues[environment].elastic_username
    }" -e "ELASTIC_PASSWORD=${
      this.dsValues[environment].elastic_password
    }" -e "xpack.security.enabled=true" docker.elastic.co/elasticsearch/elasticsearch:7.16.2`;
  };
}
