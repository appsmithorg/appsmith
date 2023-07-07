package com.appsmith.external.connections;

import com.appsmith.external.helpers.restApiUtils.connections.BasicAuthentication;
import com.appsmith.external.models.BasicAuth;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class BasicAuthenticationTest {

    @Test
    public void testCreate_validCredentials_ReturnsWithEncodedValue() {
        BasicAuth basicAuth = new BasicAuth();
        basicAuth.setUsername("test");
        basicAuth.setPassword("password");
        BasicAuthentication connection = BasicAuthentication.create(basicAuth).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        assertEquals(
                Base64.getEncoder().encodeToString("test:password".getBytes(StandardCharsets.UTF_8)),
                connection.getEncodedAuthorizationHeader());
    }
}
