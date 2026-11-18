package com.external.plugins.utils;

import org.apache.kerby.kerberos.kerb.server.SimpleKdcServer;
import org.apache.kerby.util.NetworkUtil;
import org.ietf.jgss.GSSContext;
import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSManager;
import org.ietf.jgss.Oid;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;
import java.io.File;
import java.lang.reflect.Field;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Runs the Kerberos login against a real Kerberos server (Apache Kerby) inside the test. No SQL Server is needed.
 */
public class MssqlKerberosLoginTest {

    public static final String REALM = "APPSMITH.TEST";
    public static final String USER = "svc_appsmith@" + REALM;
    public static final String PASSWORD = "correct-horse-battery";
    public static final String SERVICE = "MSSQLSvc/sql.appsmith.test:1433@" + REALM;

    private static SimpleKdcServer kdc;
    private static String previousKrb5Conf;

    @TempDir
    static Path workDir;

    @BeforeAll
    static void startKdc() throws Exception {
        kdc = startKdc(workDir.toFile());
        kdc.createPrincipal(USER, PASSWORD);
        kdc.createPrincipal(SERVICE, "service-key-password");

        previousKrb5Conf = System.getProperty("java.security.krb5.conf");
        // MssqlKerberosLogin sets refreshKrb5Config, so this file is read on the next login.
        System.setProperty("java.security.krb5.conf", new File(workDir.toFile(), "krb5.conf").getAbsolutePath());
    }

    /** Starts a Kerberos server on a free TCP port. It writes krb5.conf into {@code dir}. */
    public static SimpleKdcServer startKdc(File dir) throws Exception {
        SimpleKdcServer server = new SimpleKdcServer();
        server.setWorkDir(dir);
        server.setKdcHost("localhost");
        server.setKdcRealm(REALM);
        server.setAllowUdp(false);
        server.setAllowTcp(true);
        server.setKdcTcpPort(NetworkUtil.getServerPort());
        server.init();
        server.start();
        return server;
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

    @Test
    public void login_withTheRightPassword_returnsACredentialForThatAccount() throws Exception {
        GSSCredential credential = MssqlKerberosLogin.login(USER, PASSWORD.toCharArray());

        assertEquals(USER, credential.getName().toString());
        assertTrue(credential.getRemainingLifetime() > 0);
        assertEquals(GSSCredential.INITIATE_ONLY, credential.getUsage());
    }

    @Test
    public void credential_getsAServiceTicketForSqlServer() throws Exception {
        // The driver does the same: it starts a security context to MSSQLSvc/host:port with the credential.
        GSSCredential credential = MssqlKerberosLogin.login(USER, PASSWORD.toCharArray());
        GSSManager manager = GSSManager.getInstance();
        GSSContext context = manager.createContext(
                manager.createName(SERVICE, null),
                new Oid("1.2.840.113554.1.2.2"),
                credential,
                GSSContext.DEFAULT_LIFETIME);

        byte[] token = context.initSecContext(new byte[0], 0, 0);

        assertNotNull(token);
        assertTrue(token.length > 0);
        context.dispose();
    }

    @Test
    public void login_withAWrongPassword_fails() {
        assertThrows(LoginException.class, () -> MssqlKerberosLogin.login(USER, "wrong".toCharArray()));
    }

    @Test
    public void login_withAnUnknownAccount_fails() {
        assertThrows(LoginException.class, () -> MssqlKerberosLogin.login("nobody@" + REALM, PASSWORD.toCharArray()));
    }

    @Test
    public void login_withoutARealm_usesTheDefaultRealmFromKrb5Conf() throws Exception {
        GSSCredential credential = MssqlKerberosLogin.login("svc_appsmith", PASSWORD.toCharArray());

        assertEquals(USER, credential.getName().toString());
    }

    @Test
    public void loginConfiguration_neverUsesTheTicketCacheOrAKeytab() throws Exception {
        Field field = MssqlKerberosLogin.class.getDeclaredField("LOGIN_CONFIGURATION");
        field.setAccessible(true);
        javax.security.auth.login.Configuration configuration =
                (javax.security.auth.login.Configuration) field.get(null);

        AppConfigurationEntry[] entries = configuration.getAppConfigurationEntry(MssqlKerberosLogin.LOGIN_ENTRY_NAME);

        assertEquals(1, entries.length);
        Map<String, ?> options = entries[0].getOptions();
        assertEquals("false", options.get("useTicketCache"));
        assertEquals("false", options.get("useKeyTab"));
        assertEquals("false", options.get("storeKey"));
        // Other names, such as the driver's own "SQLJDBCDriver", are not answered.
        assertEquals(null, configuration.getAppConfigurationEntry("SQLJDBCDriver"));
        // Nothing is installed JVM-wide. With no JAAS file at all, the JDK throws a SecurityException, not a
        // LoginException.
        Exception error = assertThrows(Exception.class, () -> new LoginContext(MssqlKerberosLogin.LOGIN_ENTRY_NAME));
        assertTrue(
                error instanceof LoginException || error instanceof SecurityException,
                "Expected no login entry, got " + error);
    }
}
