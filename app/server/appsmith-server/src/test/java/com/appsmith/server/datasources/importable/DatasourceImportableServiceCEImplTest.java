package com.appsmith.server.datasources.importable;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

@ExtendWith(MockitoExtension.class)
class DatasourceImportableServiceCEImplTest { // Renamed class to match convention

    @Mock
    DatasourceService datasourceService;

    @Mock
    WorkspaceService workspaceService;

    @Mock
    SequenceService sequenceService;

    DatasourceImportableServiceCEImpl importService;

    @BeforeEach
    void setUp() {
        importService = new DatasourceImportableServiceCEImpl(datasourceService, workspaceService, sequenceService);
    }

    // Helper to call the private method using reflection
    private void callUpdateAuthenticationDTOWithReflection(
            DatasourceStorage datasourceStorage, DecryptedSensitiveFields decryptedFields) {
        try {
            Method method = DatasourceImportableServiceCEImpl.class.getDeclaredMethod(
                    "updateAuthenticationDTO", DatasourceStorage.class, DecryptedSensitiveFields.class);
            method.setAccessible(true);
            method.invoke(importService, datasourceStorage, decryptedFields);
        } catch (Exception e) {
            fail("Failed to invoke updateAuthenticationDTO via reflection", e);
        }
    }

    @Test
    void updateAuthenticationDTO_WhenAuthTypeIsBearer_AndDecryptedTokenIsValid_ShouldSetBearerTokenAuth() {
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(BearerTokenAuth.class.getName());
        BearerTokenAuth tokenDetails = new BearerTokenAuth();
        tokenDetails.setBearerToken("test-bearer-token");
        decryptedFields.setBearerTokenAuth(tokenDetails);

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        AuthenticationDTO authResult = dsConfig.getAuthentication();
        assertNotNull(authResult, "Authentication result should not be null");
        assertTrue(authResult instanceof BearerTokenAuth, "Authentication should be BearerTokenAuth");
        assertEquals("test-bearer-token", ((BearerTokenAuth) authResult).getBearerToken());
    }

    @Test
    void
            updateAuthenticationDTO_WhenAuthTypeIsBearer_AndDecryptedBearerTokenAuthIsNull_ShouldSetBearerAuthWithNullToken() {
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(BearerTokenAuth.class.getName());
        decryptedFields.setBearerTokenAuth(null); // Key condition for the fix

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        AuthenticationDTO authResult = dsConfig.getAuthentication();
        assertNotNull(authResult, "Authentication result should not be null");
        assertTrue(authResult instanceof BearerTokenAuth, "Authentication should be BearerTokenAuth");
        assertNull(((BearerTokenAuth) authResult).getBearerToken(), "Bearer token should be null");
    }

    @Test
    void updateAuthenticationDTO_WhenAuthTypeIsDbAuth_AndDbAuthDetailsArePresent_ShouldSetDbAuth() {
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(DBAuth.class.getName());
        DBAuth dbAuthDetails = new DBAuth();
        dbAuthDetails.setUsername("testuser");
        decryptedFields.setPassword("testpassword"); // Password comes from top-level DecryptedSensitiveFields
        decryptedFields.setDbAuth(dbAuthDetails);

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        AuthenticationDTO authResult = dsConfig.getAuthentication();
        assertNotNull(authResult, "Authentication result should not be null");
        assertTrue(authResult instanceof DBAuth, "Authentication should be DBAuth");
        assertEquals("testuser", ((DBAuth) authResult).getUsername());
        assertEquals("testpassword", ((DBAuth) authResult).getPassword());
    }

    @Test
    void updateAuthenticationDTO_WhenAuthTypeIsDbAuth_AndDecryptedDbAuthIsNull_ShouldSetDbAuthWithPasswordOnly() {
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(DBAuth.class.getName());
        decryptedFields.setDbAuth(null); // Decrypted DBAuth object within DecryptedSensitiveFields is null
        decryptedFields.setPassword("only-password");

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        AuthenticationDTO authResult = dsConfig.getAuthentication();
        assertNotNull(authResult, "Authentication result should not be null");
        // The actual method creates a new DBAuth if decryptedFields.getDbAuth() is null.
        // And then sets the password on it.
        assertTrue(authResult instanceof DBAuth, "Authentication should be DBAuth");
        assertNull(
                ((DBAuth) authResult).getUsername(), "Username should be null as the provided DBAuth object was null");
        assertEquals("only-password", ((DBAuth) authResult).getPassword(), "Password should be set");
    }

    @Test
    void updateAuthenticationDTO_WhenAuthTypeIsBasicAuth_AndBasicAuthDetailsArePresent_ShouldSetBasicAuth() {
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(BasicAuth.class.getName());
        BasicAuth basicAuthDetails = new BasicAuth();
        basicAuthDetails.setUsername("basicuser");
        decryptedFields.setPassword("basicpassword");
        decryptedFields.setBasicAuth(basicAuthDetails);

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        AuthenticationDTO authResult = dsConfig.getAuthentication();
        assertNotNull(authResult);
        assertTrue(authResult instanceof BasicAuth);
        assertEquals("basicuser", ((BasicAuth) authResult).getUsername());
        assertEquals("basicpassword", ((BasicAuth) authResult).getPassword());
    }

    @Test
    void updateAuthenticationDTO_WhenAuthTypeIsOAuth2_AndOAuth2DetailsArePresent_ShouldSetOAuth2() {
        // This is a simplified test for OAuth2 as it has more complex internal state (AuthenticationResponse)
        // The main goal is to ensure the OAuth2 block is entered and an OAuth2 object is set.
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(OAuth2.class.getName());
        OAuth2 oauth2Details = new OAuth2();
        oauth2Details.setClientId("test-client-id");
        // For OAuth2, password from decryptedFields is typically clientSecret
        decryptedFields.setPassword("test-client-secret");
        decryptedFields.setOpenAuth2(oauth2Details);
        // Other OAuth2 fields like token, refreshToken, tokenResponse would be set on `authResponse`
        // inside the actual method. For this test, we mainly check if OAuth2 is set.
        decryptedFields.setToken("sample-token");
        decryptedFields.setRefreshToken("sample-refresh-token");

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        AuthenticationDTO authResult = dsConfig.getAuthentication();
        assertNotNull(authResult);
        assertTrue(authResult instanceof OAuth2);
        assertEquals("test-client-id", ((OAuth2) authResult).getClientId());
        // Verifying AuthenticationResponse part is more complex due to its instantiation inside the method
        // For this test, verifying the type and one field is a good start.
        assertNotNull(((OAuth2) authResult).getAuthenticationResponse());
        assertEquals(
                "sample-token",
                ((OAuth2) authResult).getAuthenticationResponse().getToken());
        assertEquals(
                "sample-refresh-token",
                ((OAuth2) authResult).getAuthenticationResponse().getRefreshToken());
        assertEquals("test-client-secret", ((OAuth2) authResult).getClientSecret());
    }

    @Test
    void updateAuthenticationDTO_WhenDsConfigIsNull_ShouldDoNothingAndNotThrow() {
        DatasourceStorage storage = new DatasourceStorage();
        storage.setDatasourceConfiguration(null); // dsConfig is null

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(BearerTokenAuth.class.getName());

        // Expect no exception
        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);
        assertNull(storage.getDatasourceConfiguration(), "DatasourceConfiguration should remain null");
    }

    @Test
    void updateAuthenticationDTO_WhenAuthTypeIsNull_ShouldDoNothingAndNotSetAuth() {
        DatasourceStorage storage = new DatasourceStorage();
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        storage.setDatasourceConfiguration(dsConfig);

        DecryptedSensitiveFields decryptedFields = new DecryptedSensitiveFields();
        decryptedFields.setAuthType(null); // authType is null

        callUpdateAuthenticationDTOWithReflection(storage, decryptedFields);

        assertNull(dsConfig.getAuthentication(), "Authentication should not be set if authType is null");
    }
}
