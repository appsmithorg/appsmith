package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.OAuth2;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class OAuth2UtilsTest {
    @Test
    public void testGetAuthenticationExpiresAt_validateExpiresAtIfExpiresInPresent() throws IOException {
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setExpiresIn("120");

        Map<String, Object> response = new HashMap<String, Object>();
        Instant issuedAt = Instant.now();
        Integer defaultOauth2ExpiresInTimeInSeconds = 3600;
        Instant expiresAt = issuedAt.plusSeconds(defaultOauth2ExpiresInTimeInSeconds);
        response.put("expires_in", defaultOauth2ExpiresInTimeInSeconds);

        // Since expiresIn is present in oauth2 object, it will override expires_in coming from oauth2 response
        Instant expiresAtExpected = issuedAt.plusSeconds(Long.parseLong(oAuth2.getExpiresIn()));

        Instant expiresAtCalculated = OAuth2Utils.getAuthenticationExpiresAt(oAuth2, response, issuedAt);
        assertEquals(expiresAtExpected, expiresAtCalculated);
    }

    @Test
    public void testGetAuthenticationExpiresAt_validateExpiresAtIfExpiresInAbsent() throws IOException {
        OAuth2 oAuth2 = new OAuth2();

        Map<String, Object> response = new HashMap<String, Object>();
        Instant issuedAt = Instant.now();
        Integer defaultOauth2ExpiresInTimeInSeconds = 3600;

        // expiresAtExpected will be calculated based on expires_in value coming from response,
        // as oauth2 object does not have any value for expires_in
        Instant expiresAtExpected = issuedAt.plusSeconds(defaultOauth2ExpiresInTimeInSeconds);
        response.put("expires_in", defaultOauth2ExpiresInTimeInSeconds);

        Instant expiresAtCalculated = OAuth2Utils.getAuthenticationExpiresAt(oAuth2, response, issuedAt);
        assertEquals(expiresAtExpected, expiresAtCalculated);
    }

    @Test
    public void testGetAuthenticationExpiresAt_validateExpiresAtIfBothExpiresInAbsent() throws IOException {
        OAuth2 oAuth2 = new OAuth2();
        Map<String, Object> response = new HashMap<String, Object>();
        Instant issuedAt = Instant.now();

        // Since both oauth2 expiresIn and response expires_in is not present, expiresAt would be null
        Instant expiresAtCalculated = OAuth2Utils.getAuthenticationExpiresAt(oAuth2, response, issuedAt);
        assertEquals(null, expiresAtCalculated);
    }
}
