package com.appsmith.server.helpers;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.time.Instant;
import java.util.UUID;

import static com.appsmith.server.constants.ApiConstants.APPSMITH_SIGNATURE;
import static com.appsmith.server.constants.ApiConstants.DATE;

class SignatureVerifierTest {

    @Test
    public void invalidSignature_verifySignatureFormat_returnFalse() {

        HttpHeaders headers = new HttpHeaders();
        headers.set(DATE, Instant.now().toString());
        headers.set(APPSMITH_SIGNATURE, "");
        Assertions.assertFalse(SignatureVerifier.isSignatureValid(headers));
    }

    @Test
    public void invalidSignature_verifySignature_returnFalse() {

        HttpHeaders headers = new HttpHeaders();
        headers.set(DATE, Instant.now().toString());
        headers.set(APPSMITH_SIGNATURE, UUID.randomUUID().toString());
        Assertions.assertFalse(SignatureVerifier.isSignatureValid(headers));
    }
}