package com.external.plugins;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validation-only tests for the MSSQL datasource. These exercise
 * {@link MssqlPlugin.MssqlPluginExecutor#validateDatasource(DatasourceConfiguration)}
 * directly and need no database container, so they run in the fast unit lane.
 *
 * Context: APP-15746 — the database-name field must be a bare identifier and must
 * not be able to smuggle extra JDBC connection properties into the connection string.
 */
public class MssqlDatabaseNameValidationTest {

    private static DatasourceConfiguration configWithDatabaseName(String databaseName) {
        DBAuth auth = new DBAuth();
        auth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        auth.setUsername("appsmith");
        auth.setPassword("s3cr3t");
        auth.setDatabaseName(databaseName);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost("db.internal.example");
        endpoint.setPort(1433L);

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setEndpoints(List.of(endpoint));
        dsConfig.setConnection(connection);
        dsConfig.setAuthentication(auth);
        return dsConfig;
    }

    @Test
    public void acceptsPlainDatabaseName() {
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(configWithDatabaseName("mydb"));
        assertTrue(invalids.isEmpty(), "A plain database name must be accepted; got invalids: " + invalids);
    }

    @Test
    public void rejectsDatabaseNameContainingConnectionStringSeparator() {
        // Injects extra JDBC properties that would coerce the server into
        // authenticating to an attacker-controlled host over NTLM.
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(
                configWithDatabaseName("db;integratedSecurity=true;authenticationScheme=NTLM;domain=CORP"));
        assertFalse(invalids.isEmpty(), "A database name containing the ';' JDBC property separator must be rejected");
    }
}
