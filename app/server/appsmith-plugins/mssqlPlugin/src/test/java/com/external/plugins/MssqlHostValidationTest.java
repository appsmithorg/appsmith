package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MssqlErrorMessages;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The host is put into the JDBC connection string as it is, so a host must not be able to add connection properties
 * (for example ";authenticationScheme=NTLM"). These tests need no database container.
 */
public class MssqlHostValidationTest {

    private static DatasourceConfiguration configWithHost(String host) {
        DBAuth auth = new DBAuth();
        auth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        auth.setUsername("appsmith");
        auth.setPassword("s3cr3t");
        auth.setDatabaseName("mydb");

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);
        SSLDetails ssl = new SSLDetails();
        ssl.setAuthType(SSLDetails.AuthType.DISABLE);
        connection.setSsl(ssl);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setEndpoints(List.of(new Endpoint(host, 1433L)));
        dsConfig.setConnection(connection);
        dsConfig.setAuthentication(auth);
        return dsConfig;
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "db.internal.example",
                "10.0.0.5",
                // Not a connection property. (A bracketed IPv6 host passes this check, but the driver does not parse
                // it.)
                "[fe80::1]",
                // A named instance.
                "db.internal.example\\SQLEXPRESS",
                "my-server_01"
            })
    public void validateDatasource_acceptsAPlainHost(String host) {
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(configWithHost(host));

        assertFalse(
                invalids.contains(MssqlErrorMessages.DS_INVALID_HOST_ERROR_MSG),
                () -> host + " should be accepted; got " + invalids);
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "db;authenticationScheme=NTLM",
                "db;integratedSecurity=true",
                "db=x",
                "db{x}",
                "db}",
                "db\u0000x",
                "db\nx"
            })
    public void validateDatasource_refusesAHostThatAddsConnectionProperties(String host) {
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(configWithHost(host));

        assertTrue(
                invalids.contains(MssqlErrorMessages.DS_INVALID_HOST_ERROR_MSG),
                () -> host + " should be refused; got " + invalids);
    }

    // Defence in depth: a pool is never built for such a host, even when validation was skipped.
    @ParameterizedTest
    @ValueSource(strings = {"db;authenticationScheme=NTLM", "db=x"})
    public void datasourceCreate_refusesAHostThatAddsConnectionProperties(String host) {
        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(configWithHost(host)))
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof AppsmithPluginException, () -> "unexpected error: " + error);
                    assertTrue(
                            error.getMessage().contains(MssqlErrorMessages.DS_INVALID_HOST_ERROR_MSG),
                            () -> "unexpected message: " + error.getMessage());
                })
                .verify();
    }
}
