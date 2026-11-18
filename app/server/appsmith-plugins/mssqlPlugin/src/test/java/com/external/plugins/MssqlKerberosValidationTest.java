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
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validation and settings for the "Windows (Kerberos)" authentication type. These tests need no database container.
 */
class MssqlKerberosValidationTest {

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
    void should_useSqlServerLogin_when_theDatasourceHasNoSetting() {
        // Given
        DatasourceConfiguration dsConfig = config("sa", null);

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(MssqlAuthenticationSettings.method(dsConfig))
                .isEqualTo(MssqlAuthenticationSettings.SQL_SERVER_LOGIN);
        assertThat(MssqlAuthenticationSettings.isKerberos(dsConfig)).isFalse();
        assertThat(invalids).isEmpty();
    }

    @Test
    void should_acceptADomainBackslashUsername_when_usingASqlServerLogin() {
        // Given: only Kerberos refuses a username in the DOMAIN-backslash-user form. A SQL Server login is passed on as
        // it is, as before.
        List<Property> properties = new ArrayList<>(List.of(
                new Property(MssqlAuthenticationSettings.METHOD_KEY, MssqlAuthenticationSettings.SQL_SERVER_LOGIN)));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(config("CORP\\appsmith", properties));

        // Then
        assertThat(invalids).isEmpty();
    }

    @Test
    void should_accept_when_kerberosHasAPrincipal() {
        // Given
        DatasourceConfiguration dsConfig = config("svc_appsmith@corp.example.com", kerberos(null));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(MssqlAuthenticationSettings.isKerberos(dsConfig)).isTrue();
        assertThat(invalids).isEmpty();
    }

    @Test
    void should_refuseWithAHint_when_kerberosHasADomainBackslashUsername() {
        // Given
        DatasourceConfiguration dsConfig = config("CORP\\svc_appsmith", kerberos(null));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(invalids).containsExactly(MssqlErrorMessages.DS_KERBEROS_DOMAIN_BACKSLASH_USERNAME_ERROR_MSG);
    }

    @ParameterizedTest
    @ValueSource(strings = {"svc appsmith@CORP", "svc@CORP@OTHER", "@CORP", "svc@", "svc\n@CORP"})
    void should_refuse_when_theKerberosUsernameIsMalformed(String username) {
        // Given
        DatasourceConfiguration dsConfig = config(username, kerberos(null));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(invalids).containsExactly(MssqlErrorMessages.DS_INVALID_KERBEROS_USERNAME_ERROR_MSG);
    }

    @Test
    void should_reportMissingDetails_when_kerberosHasNoUsernameOrPassword() {
        // Given
        DatasourceConfiguration dsConfig = config("", kerberos(null));
        ((DBAuth) dsConfig.getAuthentication()).setPassword(null);

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(invalids)
                .contains(
                        MssqlErrorMessages.DS_MISSING_USERNAME_ERROR_MSG,
                        MssqlErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
    }

    @Test
    void should_reportAMissingUsername_when_theKerberosUsernameIsOnlySpaces() {
        // Given
        DatasourceConfiguration dsConfig = config("   ", kerberos(null));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(invalids).containsExactly(MssqlErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
    }

    @Test
    void should_refuse_when_theServerSpnContainsASpace() {
        // Given
        DatasourceConfiguration dsConfig = config("svc@CORP.EXAMPLE.COM", kerberos("MSSQLSvc/sql host:1433"));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(dsConfig);

        // Then
        assertThat(invalids).containsExactly(MssqlErrorMessages.DS_INVALID_SERVER_SPN_ERROR_MSG);
    }

    @Test
    void should_refuse_when_theAuthenticationTypeIsUnknown() {
        // Given
        List<Property> properties =
                new ArrayList<>(List.of(new Property(MssqlAuthenticationSettings.METHOD_KEY, "NTLM")));

        // When
        Set<String> invalids = mssqlPluginExecutor.validateDatasource(config("svc", properties));

        // Then
        assertThat(invalids).containsExactly(MssqlErrorMessages.DS_INVALID_AUTHENTICATION_TYPE_ERROR_MSG);
    }

    @Test
    void should_readTheFormSlots_when_theValuesArriveWithoutTheirKeys() {
        // Given: editing a datasource saved before this setting existed, the form does not fill in the hidden key.
        List<Property> properties = new ArrayList<>();
        properties.add(new Property(null, MssqlAuthenticationSettings.KERBEROS));
        properties.add(new Property(null, "MSSQLSvc/alias.corp.example.com:1433"));

        // When
        DatasourceConfiguration dsConfig = config("svc@CORP.EXAMPLE.COM", properties);

        // Then
        assertThat(MssqlAuthenticationSettings.isKerberos(dsConfig)).isTrue();
        assertThat(MssqlAuthenticationSettings.serverSpn(dsConfig)).isEqualTo("MSSQLSvc/alias.corp.example.com:1433");
    }

    @Test
    void should_useSqlServerLogin_when_theFormSlotIsNull() {
        // Given: a sparse array from the editor can arrive with a null entry.
        List<Property> properties = new ArrayList<>();
        properties.add(null);

        // When
        String method = MssqlAuthenticationSettings.method(config("svc", properties));

        // Then
        assertThat(method).isEqualTo(MssqlAuthenticationSettings.SQL_SERVER_LOGIN);
    }

    @Test
    void should_preferTheKeyedProperty_when_theSlotAlsoHasAValueWithoutAKey() {
        // Given
        List<Property> properties = new ArrayList<>();
        properties.add(new Property(null, MssqlAuthenticationSettings.KERBEROS));
        properties.add(new Property(null, null));
        properties.add(
                new Property(MssqlAuthenticationSettings.METHOD_KEY, MssqlAuthenticationSettings.SQL_SERVER_LOGIN));

        // When
        boolean kerberos = MssqlAuthenticationSettings.isKerberos(config("svc", properties));

        // Then
        assertThat(kerberos).isFalse();
    }

    @Test
    void should_ignoreTheSlot_when_itHoldsAnotherKey() {
        // Given
        List<Property> properties = new ArrayList<>(List.of(new Property("somethingElse", "KERBEROS")));

        // When
        boolean kerberos = MssqlAuthenticationSettings.isKerberos(config("svc", properties));

        // Then
        assertThat(kerberos).isFalse();
    }

    @Test
    void should_returnNull_when_theServerSpnIsBlank() {
        // Given
        DatasourceConfiguration dsConfig = config("svc", kerberos("  "));

        // When
        String serverSpn = MssqlAuthenticationSettings.serverSpn(dsConfig);

        // Then
        assertThat(serverSpn).isNull();
    }

    @ParameterizedTest
    @CsvSource({
        "' Svc_Appsmith@corp.example.com ', Svc_Appsmith@CORP.EXAMPLE.COM",
        "svc_appsmith@CORP.EXAMPLE.COM, svc_appsmith@CORP.EXAMPLE.COM",
        "svc_appsmith, svc_appsmith"
    })
    void should_upperCaseOnlyTheRealm_when_makingThePrincipal(String username, String expectedPrincipal) {
        // Given / When
        String principal = MssqlAuthenticationSettings.kerberosPrincipal(username);

        // Then
        assertThat(principal).isEqualTo(expectedPrincipal);
    }
}
