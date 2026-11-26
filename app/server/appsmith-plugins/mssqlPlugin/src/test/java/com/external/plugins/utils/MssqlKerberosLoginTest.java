package com.external.plugins.utils;

import org.ietf.jgss.GSSContext;
import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSManager;
import org.ietf.jgss.Oid;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;
import java.lang.reflect.Field;
import java.nio.file.Path;
import java.util.Map;

import static com.external.plugins.utils.MssqlKerberosTestKdc.PASSWORD;
import static com.external.plugins.utils.MssqlKerberosTestKdc.REALM;
import static com.external.plugins.utils.MssqlKerberosTestKdc.SERVICE;
import static com.external.plugins.utils.MssqlKerberosTestKdc.USER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Runs the Kerberos login against a real Kerberos server (Apache Kerby) inside the test. No SQL Server is needed.
 */
class MssqlKerberosLoginTest {

    private static MssqlKerberosTestKdc kdc;

    @TempDir
    static Path workDir;

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

    @Test
    void should_returnACredentialForTheAccount_when_thePasswordIsRight() throws Exception {
        // Given
        char[] password = PASSWORD.toCharArray();

        // When
        GSSCredential credential = MssqlKerberosLogin.login(USER, password);

        // Then
        assertThat(credential.getName().toString()).isEqualTo(USER);
        assertThat(credential.getRemainingLifetime()).isPositive();
        assertThat(credential.getUsage()).isEqualTo(GSSCredential.INITIATE_ONLY);
    }

    @Test
    void should_getAServiceTicketForSqlServer_when_usingTheCredential() throws Exception {
        // Given: the driver does the same, starting a security context to MSSQLSvc/host:port with the credential.
        GSSCredential credential = MssqlKerberosLogin.login(USER, PASSWORD.toCharArray());
        GSSManager manager = GSSManager.getInstance();
        GSSContext context = manager.createContext(
                manager.createName(SERVICE, null),
                new Oid("1.2.840.113554.1.2.2"),
                credential,
                GSSContext.DEFAULT_LIFETIME);

        // When
        byte[] token = context.initSecContext(new byte[0], 0, 0);

        // Then
        assertThat(token).isNotEmpty();
        context.dispose();
    }

    @Test
    void should_fail_when_thePasswordIsWrong() {
        // Given
        char[] wrongPassword = "wrong".toCharArray();

        // When / Then
        // A real domain controller's answer must count as a refusal, so the plugin waits before trying again.
        assertThatThrownBy(() -> MssqlKerberosLogin.login(USER, wrongPassword))
                .isInstanceOf(LoginException.class)
                .satisfies(error ->
                        assertThat(MssqlKerberosErrors.isAccountRefused(error)).isTrue());
    }

    @Test
    void should_fail_when_theAccountDoesNotExist() {
        // Given
        String unknownAccount = "nobody@" + REALM;

        // When / Then
        assertThatThrownBy(() -> MssqlKerberosLogin.login(unknownAccount, PASSWORD.toCharArray()))
                .isInstanceOf(LoginException.class)
                .satisfies(error ->
                        assertThat(MssqlKerberosErrors.isAccountRefused(error)).isTrue());
    }

    @Test
    void should_useTheDefaultRealm_when_theUsernameHasNoRealm() throws Exception {
        // Given
        String usernameWithoutRealm = "svc_appsmith";

        // When
        GSSCredential credential = MssqlKerberosLogin.login(usernameWithoutRealm, PASSWORD.toCharArray());

        // Then
        assertThat(credential.getName().toString()).isEqualTo(USER);
    }

    @Test
    void should_refuseTheLogin_when_theJvmPrincipalSettingNamesAnotherAccount() {
        // Given
        System.setProperty(MssqlKerberosLogin.PRINCIPAL_PROPERTY, "someone_else@" + REALM);
        try {
            // When / Then
            assertThatThrownBy(() -> MssqlKerberosLogin.login(USER, PASSWORD.toCharArray()))
                    .isInstanceOf(LoginException.class)
                    .hasMessage(MssqlKerberosLogin.PRINCIPAL_PROPERTY_ERROR);
        } finally {
            System.clearProperty(MssqlKerberosLogin.PRINCIPAL_PROPERTY);
        }
    }

    @Test
    void should_logIn_when_theJvmPrincipalSettingNamesTheSameAccountWithoutARealm() throws Exception {
        // Given
        System.setProperty(MssqlKerberosLogin.PRINCIPAL_PROPERTY, "svc_appsmith");
        try {
            // When
            GSSCredential credential = MssqlKerberosLogin.login(USER, PASSWORD.toCharArray());

            // Then
            assertThat(credential.getName().toString()).isEqualTo(USER);
        } finally {
            System.clearProperty(MssqlKerberosLogin.PRINCIPAL_PROPERTY);
        }
    }

    @Test
    void should_neverUseTheTicketCacheOrAKeytab_when_readingTheLoginConfiguration() throws Exception {
        // Given
        Field field = MssqlKerberosLogin.class.getDeclaredField("LOGIN_CONFIGURATION");
        field.setAccessible(true);
        Configuration configuration = (Configuration) field.get(null);

        // When
        AppConfigurationEntry[] entries = configuration.getAppConfigurationEntry(MssqlKerberosLogin.LOGIN_ENTRY_NAME);

        // Then
        assertThat(entries).hasSize(1);
        Map<String, ?> options = entries[0].getOptions();
        assertThat(options.get("useTicketCache")).isEqualTo("false");
        assertThat(options.get("useKeyTab")).isEqualTo("false");
        assertThat(options.get("storeKey")).isEqualTo("false");
        // Other names, such as the driver's own "SQLJDBCDriver", are not answered.
        assertThat(configuration.getAppConfigurationEntry("SQLJDBCDriver")).isNull();
        // Nothing is installed JVM-wide. With no JAAS file at all, the JDK throws a SecurityException instead.
        assertThatThrownBy(() -> new LoginContext(MssqlKerberosLogin.LOGIN_ENTRY_NAME))
                .isInstanceOfAny(LoginException.class, SecurityException.class);
    }
}
