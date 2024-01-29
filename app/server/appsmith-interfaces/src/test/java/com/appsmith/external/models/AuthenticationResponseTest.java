package com.appsmith.external.models;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthenticationResponseTest {

    @Test
    void testCanEqual() {
        assertFalse((new AuthenticationResponse()).canEqual("Other"));
    }

    @Test
    void testCanEqual2() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        assertTrue(authenticationResponse.canEqual(new AuthenticationResponse()));
    }

    @Test
    void testConstructor() {
        AuthenticationResponse actualAuthenticationResponse = new AuthenticationResponse();
        actualAuthenticationResponse.setExpiresAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        actualAuthenticationResponse.setIssuedAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        actualAuthenticationResponse.setProjectID("Project ID");
        actualAuthenticationResponse.setRefreshToken("ABC123");
        actualAuthenticationResponse.setToken("ABC123");
        actualAuthenticationResponse.setTokenResponse("Token Response");
        String actualToStringResult = actualAuthenticationResponse.toString();
        Instant actualExpiresAt = actualAuthenticationResponse.getExpiresAt();
        Instant actualIssuedAt = actualAuthenticationResponse.getIssuedAt();
        String actualProjectID = actualAuthenticationResponse.getProjectID();
        String actualRefreshToken = actualAuthenticationResponse.getRefreshToken();
        String actualToken = actualAuthenticationResponse.getToken();
        assertEquals("ABC123", actualRefreshToken);
        assertEquals("ABC123", actualToken);
        assertEquals(
            "AuthenticationResponse(token=ABC123, refreshToken=ABC123, issuedAt=1970-01-01T00:00:00Z, expiresAt"
                + "=1970-01-01T00:00:00Z, tokenResponse=Token Response, projectID=Project ID)",
            actualToStringResult);
        assertEquals("Project ID", actualProjectID);
        assertSame(actualExpiresAt, actualIssuedAt);
        assertSame(actualAuthenticationResponse.tokenResponse, actualAuthenticationResponse.getTokenResponse());
        assertSame(actualIssuedAt.EPOCH, actualExpiresAt);
    }

    @Test
    void testConstructor2() {
        Instant issuedAt =
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant();
        AuthenticationResponse actualAuthenticationResponse = new AuthenticationResponse(
            "ABC123",
            "ABC123",
            issuedAt,
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant(),
            "Token Response",
            "Project ID");
        actualAuthenticationResponse.setExpiresAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        actualAuthenticationResponse.setIssuedAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        actualAuthenticationResponse.setProjectID("Project ID");
        actualAuthenticationResponse.setRefreshToken("ABC123");
        actualAuthenticationResponse.setToken("ABC123");
        actualAuthenticationResponse.setTokenResponse("Token Response");
        String actualToStringResult = actualAuthenticationResponse.toString();
        Instant actualExpiresAt = actualAuthenticationResponse.getExpiresAt();
        Instant actualIssuedAt = actualAuthenticationResponse.getIssuedAt();
        String actualProjectID = actualAuthenticationResponse.getProjectID();
        String actualRefreshToken = actualAuthenticationResponse.getRefreshToken();
        String actualToken = actualAuthenticationResponse.getToken();
        assertEquals("ABC123", actualRefreshToken);
        assertEquals("ABC123", actualToken);
        assertEquals(
            "AuthenticationResponse(token=ABC123, refreshToken=ABC123, issuedAt=1970-01-01T00:00:00Z, expiresAt"
                + "=1970-01-01T00:00:00Z, tokenResponse=Token Response, projectID=Project ID)",
            actualToStringResult);
        assertEquals("Project ID", actualProjectID);
        assertSame(actualExpiresAt, actualIssuedAt);
        assertSame(actualAuthenticationResponse.tokenResponse, actualAuthenticationResponse.getTokenResponse());
        assertSame(actualIssuedAt.EPOCH, actualExpiresAt);
    }

    @Test
    void testEquals() {
        assertNotEquals(new AuthenticationResponse(), null);
        assertNotEquals(new AuthenticationResponse(), "Different type to AuthenticationResponse");
    }

    @Test
    void testEquals2() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        assertEquals(authenticationResponse, authenticationResponse);
        int expectedHashCodeResult = authenticationResponse.hashCode();
        assertEquals(expectedHashCodeResult, authenticationResponse.hashCode());
    }

    @Test
    void testEquals3() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse();
        assertEquals(authenticationResponse, authenticationResponse2);
        int expectedHashCodeResult = authenticationResponse.hashCode();
        assertEquals(expectedHashCodeResult, authenticationResponse2.hashCode());
    }

    @Test
    void testEquals4() {
        Instant issuedAt =
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant();
        AuthenticationResponse authenticationResponse = new AuthenticationResponse(
            "ABC123",
            "ABC123",
            issuedAt,
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant(),
            "Token Response",
            "Project ID");
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }

    @Test
    void testEquals5() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        Instant issuedAt =
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant();
        assertNotEquals(
            authenticationResponse,
            new AuthenticationResponse(
                "ABC123",
                "ABC123",
                issuedAt,
                LocalDate.of(1970, 1, 1)
                    .atStartOfDay()
                    .atZone(ZoneOffset.UTC)
                    .toInstant(),
                "Token Response",
                "Project ID"));
    }

    @Test
    void testEquals6() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setRefreshToken("ABC123");
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }

    @Test
    void testEquals7() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setIssuedAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }

    @Test
    void testEquals8() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setExpiresAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }

    @Test
    void testEquals9() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setTokenResponse("Token Response");
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }

    @Test
    void testEquals10() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setProjectID("Project ID");
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }

    @Test
    void testEquals11() {
        Instant issuedAt =
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant();
        AuthenticationResponse authenticationResponse = new AuthenticationResponse(
            "ABC123",
            "ABC123",
            issuedAt,
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant(),
            "Token Response",
            "Project ID");
        Instant issuedAt2 =
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant();
        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse(
            "ABC123",
            "ABC123",
            issuedAt2,
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant(),
            "Token Response",
            "Project ID");

        assertEquals(authenticationResponse, authenticationResponse2);
        int expectedHashCodeResult = authenticationResponse.hashCode();
        assertEquals(expectedHashCodeResult, authenticationResponse2.hashCode());
    }

    @Test
    void testEquals12() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();

        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse();
        authenticationResponse2.setRefreshToken("ABC123");
        assertNotEquals(authenticationResponse, authenticationResponse2);
    }

    @Test
    void testEquals13() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();

        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse();
        authenticationResponse2.setIssuedAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        assertNotEquals(authenticationResponse, authenticationResponse2);
    }

    @Test
    void testEquals14() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();

        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse();
        authenticationResponse2.setExpiresAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        assertNotEquals(authenticationResponse, authenticationResponse2);
    }

    @Test
    void testEquals15() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();

        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse();
        authenticationResponse2.setTokenResponse("Token Response");
        assertNotEquals(authenticationResponse, authenticationResponse2);
    }

    @Test
    void testEquals16() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();

        AuthenticationResponse authenticationResponse2 = new AuthenticationResponse();
        authenticationResponse2.setProjectID("Project ID");
        assertNotEquals(authenticationResponse, authenticationResponse2);
    }

    @Test
    void testEquals17() {
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setTokenResponse(new AuthenticationResponse());
        assertNotEquals(authenticationResponse, new AuthenticationResponse());
    }
}
