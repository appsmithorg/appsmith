package com.external.connections;

import com.appsmith.external.models.BasicAuth;
import org.junit.Assert;
import org.junit.Test;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

public class BasicAuthenticationTest {

    @Test
    public void testCreate_validCredentials_ReturnsWithEncodedValue() {
        BasicAuth basicAuth = new BasicAuth();
        basicAuth.setUsername("test");
        basicAuth.setPassword("password");
        BasicAuthentication connection = BasicAuthentication.create(basicAuth).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        Assert.assertEquals(
                Base64.getEncoder().encodeToString("test:password".getBytes(StandardCharsets.UTF_8)),
                connection.getEncodedAuthorizationHeader());
    }
}