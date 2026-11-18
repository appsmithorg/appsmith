package com.external.plugins;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MssqlErrorMessages;
import com.external.plugins.utils.MssqlAuthenticationSettings;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validation and settings for the "Windows (Kerberos)" authentication method. These tests need no database
 * container.
 */
public class MssqlKerberosValidationTest {

    private static DatasourceConfiguration config(String username, List<Property> properties) {
        DBAuth auth = new DBAuth();
        auth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        auth.setUsername(username);
        auth.setPassword("s3cr3t");
        auth.setDatabaseName("mydb");

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);
        SSLDetails ssl = new SSLDetails();
        ssl.setAuthType(SSLDetails.AuthType.NO_VERIFY);
        connection.setSsl(ssl);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setEndpoints(List.of(new Endpoint("sql.corp.example.com", 1433L)));
        dsConfig.setConnection(connection);
        dsConfig.setAuthentication(auth);
        dsConfig.setProperties(properties);
        return dsConfig;
    }

    private static List<Property> kerberos(String serverSpn) {
        List<Property> properties = new ArrayList<>();
        properties.add(new Property(MssqlAuthenticationSettings.METHOD_KEY, MssqlAuthenticationSettings.KERBEROS));
        properties.add(new Property(MssqlAuthenticationSettings.SERVER_SPN_KEY, serverSpn));
        return properties;
    }

    @Test
    public void datasourceWithoutTheSetting_staysOnSqlServerLogin() {
        DatasourceConfiguration dsConfig = config("sa", null);

        assertEquals(MssqlAuthenticationSettings.SQL_SERVER_LOGIN, MssqlAuthenticationSettings.method(dsConfig));
        assertFalse(MssqlAuthenticationSettings.isKerberos(dsConfig));
        assertTrue(mssqlPluginExecutor.validateDatasource(dsConfig).isEmpty());
    }

    @Test
    public void sqlServerLogin_stillAcceptsADomainBackslashUserName() {
        // Only Kerberos refuses DOMAIN\\user. A SQL Server login is passed on as it is, as before.
        List<Property> properties = new ArrayList<>(List.of(
                new Property(MssqlAuthenticationSettings.METHOD_KEY, MssqlAuthenticationSettings.SQL_SERVER_LOGIN)));

        assertTrue(mssqlPluginExecutor
                .validateDatasource(config("CORP\\appsmith", properties))
                .isEmpty());
    }

    @Test
    public void kerberos_withAPrincipal_isValid() {
        DatasourceConfiguration dsConfig = config("svc_appsmith@corp.example.com", kerberos(null));

        assertTrue(MssqlAuthenticationSettings.isKerberos(dsConfig));
        assertTrue(mssqlPluginExecutor.validateDatasource(dsConfig).isEmpty());
    }

    @Test
    public void kerberos_withADomainBackslashUserName_isRefusedWithAHint() {
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(config("CORP\\svc_appsmith", kerberos(null)));

        assertEquals(Set.of(MssqlErrorMessages.DS_KERBEROS_DOMAIN_BACKSLASH_USERNAME_ERROR_MSG), invalids);
    }

    @ParameterizedTest
    @ValueSource(strings = {"svc appsmith@CORP", "svc@CORP@OTHER", "@CORP", "svc@", "svc\n@CORP"})
    public void kerberos_withAMalformedUserName_isRefused(String username) {
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(config(username, kerberos(null)));

        assertEquals(Set.of(MssqlErrorMessages.DS_INVALID_KERBEROS_USERNAME_ERROR_MSG), invalids);
    }

    @Test
    public void kerberos_stillNeedsAUserNameAndPassword() {
        DatasourceConfiguration dsConfig = config("", kerberos(null));
        ((DBAuth) dsConfig.getAuthentication()).setPassword(null);

        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        assertTrue(invalids.contains("Missing username for authentication."));
        assertTrue(invalids.contains("Missing password for authentication."));
    }

    @Test
    public void kerberos_withAServerSpnContainingASpace_isRefused() {
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(
                config("svc@CORP.EXAMPLE.COM", kerberos("MSSQLSvc/sql host:1433")));

        assertEquals(Set.of(MssqlErrorMessages.DS_INVALID_SERVER_SPN_ERROR_MSG), invalids);
    }

    @Test
    public void unknownMethod_isRefused() {
        List<Property> properties =
                new ArrayList<>(List.of(new Property(MssqlAuthenticationSettings.METHOD_KEY, "NTLM")));

        Set<String> invalids = mssqlPluginExecutor.validateDatasource(config("svc", properties));

        assertEquals(Set.of(MssqlErrorMessages.DS_INVALID_AUTHENTICATION_TYPE_ERROR_MSG), invalids);
    }

    @Test
    public void valueWithoutItsKey_inTheFormSlot_isStillRead() {
        // Editing a datasource saved before this setting existed: the form does not fill in the hidden key.
        List<Property> properties = new ArrayList<>();
        properties.add(new Property(null, MssqlAuthenticationSettings.KERBEROS));
        properties.add(new Property(null, "MSSQLSvc/alias.corp.example.com:1433"));
        DatasourceConfiguration dsConfig = config("svc@CORP.EXAMPLE.COM", properties);

        assertTrue(MssqlAuthenticationSettings.isKerberos(dsConfig));
        assertEquals("MSSQLSvc/alias.corp.example.com:1433", MssqlAuthenticationSettings.serverSpn(dsConfig));
    }

    @Test
    public void nullEntryInTheFormSlot_staysOnSqlServerLogin() {
        // A sparse array from the editor can arrive with a null entry.
        List<Property> properties = new ArrayList<>();
        properties.add(null);

        assertEquals(
                MssqlAuthenticationSettings.SQL_SERVER_LOGIN,
                MssqlAuthenticationSettings.method(config("svc", properties)));
    }

    @Test
    public void keyedProperty_winsOverAValueWithoutAKeyInTheSlot() {
        List<Property> properties = new ArrayList<>();
        properties.add(new Property(null, MssqlAuthenticationSettings.KERBEROS));
        properties.add(new Property(null, null));
        properties.add(
                new Property(MssqlAuthenticationSettings.METHOD_KEY, MssqlAuthenticationSettings.SQL_SERVER_LOGIN));

        assertFalse(MssqlAuthenticationSettings.isKerberos(config("svc", properties)));
    }

    @Test
    public void propertyWithAnotherKey_inTheFormSlot_isNotRead() {
        List<Property> properties = new ArrayList<>(List.of(new Property("somethingElse", "KERBEROS")));

        assertFalse(MssqlAuthenticationSettings.isKerberos(config("svc", properties)));
    }

    @Test
    public void blankServerSpn_isNull() {
        assertNull(MssqlAuthenticationSettings.serverSpn(config("svc", kerberos("  "))));
    }

    @Test
    public void kerberosPrincipal_upperCasesTheRealmOnly() {
        assertEquals(
                "Svc_Appsmith@CORP.EXAMPLE.COM",
                MssqlAuthenticationSettings.kerberosPrincipal(" Svc_Appsmith@corp.example.com "));
        assertEquals("svc_appsmith", MssqlAuthenticationSettings.kerberosPrincipal("svc_appsmith"));
    }
}
