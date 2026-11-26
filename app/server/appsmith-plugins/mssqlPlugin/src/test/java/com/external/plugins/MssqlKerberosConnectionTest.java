package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.utils.MssqlAuthenticationSettings;
import com.external.plugins.utils.MssqlKerberosTestKdc;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static com.external.plugins.MssqlTestDBContainerManager.createDatasourceConfiguration;
import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static com.external.plugins.utils.MssqlKerberosTestKdc.PASSWORD;
import static com.external.plugins.utils.MssqlKerberosTestKdc.SERVICE;
import static com.external.plugins.utils.MssqlKerberosTestKdc.USER;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs a Kerberos datasource through the whole plugin: the form settings, the Kerberos login against a test Kerberos
 * server, and the driver's Kerberos handshake with a real SQL Server.
 *
 * <p>The test SQL Server is not joined to an Active Directory domain, so it cannot accept the ticket. Its answer,
 * "untrusted domain", shows that the plugin logged in, got a service ticket and sent it to SQL Server. Accepting the
 * ticket is SQL Server's and Active Directory's part. Testing that needs a domain controller and a SQL Server joined
 * to the domain, so it is done by hand.
 */
@Testcontainers
class MssqlKerberosConnectionTest {

    @SuppressWarnings("rawtypes")
    @Container
    static final MSSQLServerContainer container = MssqlTestDBContainerManager.getMssqlDBForTest();

    @TempDir
    static Path workDir;

    private static MssqlKerberosTestKdc kdc;

    @BeforeAll
    static void startKdc() throws Exception {
        kdc = MssqlKerberosTestKdc.start(workDir.toFile());
    }

    @AfterAll
    static void stopKdc() throws Exception {
        if (kdc != null) {
            kdc.close();
        }
    }

    private static DatasourceConfiguration kerberosConfig(String username, String password) {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);
        DBAuth auth = (DBAuth) dsConfig.getAuthentication();
        auth.setUsername(username);
        auth.setPassword(password);
        List<Property> properties = new ArrayList<>();
        properties.add(new Property(MssqlAuthenticationSettings.METHOD_KEY, MssqlAuthenticationSettings.KERBEROS));
        // The container is reached as localhost:<random port>, so name the service explicitly, as a customer would
        // for an alias.
        properties.add(new Property(MssqlAuthenticationSettings.SERVER_SPN_KEY, SERVICE));
        dsConfig.setProperties(properties);
        return dsConfig;
    }

    private static String details(Throwable error) {
        return error instanceof AppsmithPluginException pluginException
                ? pluginException.getDownstreamErrorMessage()
                : error.getMessage();
    }

    @Test
    void should_sendAKerberosTicketToSqlServer_when_theAccountIsRight() {
        // Given
        DatasourceConfiguration dsConfig = kerberosConfig(USER, PASSWORD);
        assertThat(mssqlPluginExecutor.validateDatasource(dsConfig)).isEmpty();

        // When / Then: SQL Server got the ticket (error 18452), so the login and the handshake both worked.
        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(dsConfig))
                .expectErrorSatisfies(error ->
                        assertThat(details(error)).contains("untrusted domain").doesNotContain("Kerberos login failed"))
                .verify();
    }

    @Test
    void should_failAtTheKerberosLogin_when_thePasswordIsWrong() {
        // Given
        DatasourceConfiguration dsConfig = kerberosConfig(USER, "wrong-password");

        // When / Then
        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(dsConfig))
                .expectErrorSatisfies(error -> assertThat(details(error))
                        .contains("Kerberos login failed for " + USER)
                        .contains("Check the username and password")
                        .doesNotContain("wrong-password"))
                .verify();
    }

    @Test
    void should_stillConnect_when_usingASqlServerLogin() {
        // Given
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);

        // When / Then
        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(dsConfig))
                .assertNext(pool -> {
                    assertThat(pool.isRunning()).isTrue();
                    pool.close();
                })
                .verifyComplete();
    }
}
