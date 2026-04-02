package com.appsmith.external.helpers;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class JdbcHostValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {"myhost", "my.db.host.com", "my-db-host", "10.0.1.5", "192.168.1.100"})
    public void validateHostname_allowsValidHostnames(String host) {
        Optional<String> result = JdbcHostValidator.validateHostname(host);
        assertTrue(result.isEmpty(), "Expected host '" + host + "' to be allowed, but got: " + result.orElse(""));
    }

    @Test
    public void validateHostname_blocksNullAndEmpty() {
        assertTrue(JdbcHostValidator.validateHostname(null).isPresent());
        assertTrue(JdbcHostValidator.validateHostname("").isPresent());
        assertTrue(JdbcHostValidator.validateHostname("   ").isPresent());
    }

    @ParameterizedTest
    @ValueSource(strings = {"evil.com#", "evil.com/path", "evil.com:1234", "user@evil.com", "evil.com?", "evil.com\\"})
    public void validateHostname_blocksDisallowedCharacters(String host) {
        Optional<String> result = JdbcHostValidator.validateHostname(host);
        assertTrue(result.isPresent(), "Expected host '" + host + "' to be blocked");
    }

    @ParameterizedTest
    @ValueSource(strings = {"169.254.169.254", "100.100.100.200", "168.63.129.16"})
    public void checkSsrfProtection_blocksMetadataIps(String host) {
        Optional<String> result = JdbcHostValidator.checkSsrfProtection(host);
        assertTrue(result.isPresent(), "Expected metadata IP '" + host + "' to be blocked by SSRF check");
    }

    @ParameterizedTest
    @ValueSource(strings = {"10.0.1.5", "192.168.1.1", "172.16.0.1"})
    public void checkSsrfProtection_allowsPrivateIps(String host) {
        Optional<String> result = JdbcHostValidator.checkSsrfProtection(host);
        assertTrue(result.isEmpty(), "Expected private IP '" + host + "' to be allowed for self-hosted deployments");
    }
}
