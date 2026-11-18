package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.utils.MssqlAuthenticationSettings;
import com.external.plugins.utils.MssqlKerberosLoginTest;
import org.apache.kerby.kerberos.kerb.server.SimpleKdcServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static com.external.plugins.MssqlTestDBContainerManager.createDatasourceConfiguration;
import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static com.external.plugins.utils.MssqlKerberosLoginTest.PASSWORD;
import static com.external.plugins.utils.MssqlKerberosLoginTest.SERVICE;
import static com.external.plugins.utils.MssqlKerberosLoginTest.USER;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
public class MssqlKerberosConnectionTest {

    @SuppressWarnings("rawtypes")
    @Container
    public static final MSSQLServerContainer container = MssqlTestDBContainerManager.getMssqlDBForTest();

    @TempDir
    static Path workDir;

    private static SimpleKdcServer kdc;
    private static String previousKrb5Conf;

    @BeforeAll
    static void startKdc() throws Exception {
        kdc = MssqlKerberosLoginTest.startKdc(workDir.toFile());
        kdc.createPrincipal(USER, PASSWORD);
        kdc.createPrincipal(SERVICE, "service-key-password");
        previousKrb5Conf = System.getProperty("java.security.krb5.conf");
        System.setProperty("java.security.krb5.conf", new File(workDir.toFile(), "krb5.conf").getAbsolutePath());
    }

    @AfterAll
    static void stopKdc() throws Exception {
        if (kdc != null) {
            kdc.stop();
        }
        if (previousKrb5Conf == null) {
            System.clearProperty("java.security.krb5.conf");
        } else {
            System.setProperty("java.security.krb5.conf", previousKrb5Conf);
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

    @Test
    public void kerberosDatasource_sendsAKerberosTicketToSqlServer() {
        DatasourceConfiguration dsConfig = kerberosConfig(USER, PASSWORD);
        assertTrue(mssqlPluginExecutor.validateDatasource(dsConfig).isEmpty());

        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(dsConfig))
                .expectErrorSatisfies(error -> {
                    String details = error instanceof AppsmithPluginException pluginException
                            ? pluginException.getDownstreamErrorMessage()
                            : error.getMessage();
                    // SQL Server got the ticket (error 18452), so the login and the handshake both worked.
                    assertTrue(details.contains("untrusted domain"), details);
                    assertFalse(details.contains("Kerberos login failed"), details);
                })
                .verify();
    }

    @Test
    public void kerberosDatasource_withAWrongPassword_failsAtTheKerberosLogin() {
        DatasourceConfiguration dsConfig = kerberosConfig(USER, "wrong-password");

        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(dsConfig))
                .expectErrorSatisfies(error -> {
                    String details = error instanceof AppsmithPluginException pluginException
                            ? pluginException.getDownstreamErrorMessage()
                            : error.getMessage();
                    assertTrue(details.contains("Kerberos login failed for " + USER), details);
                    assertFalse(details.contains("wrong-password"), details);
                })
                .verify();
    }

    @Test
    public void sqlServerLoginDatasource_stillConnects() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);

        StepVerifier.create(mssqlPluginExecutor.datasourceCreate(dsConfig))
                .assertNext(pool -> {
                    assertTrue(pool.isRunning());
                    pool.close();
                })
                .verifyComplete();
    }
}
