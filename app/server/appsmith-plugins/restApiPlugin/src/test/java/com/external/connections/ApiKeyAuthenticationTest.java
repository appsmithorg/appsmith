package com.external.connections;

import com.appsmith.external.models.ApiKeyAuth;
import org.junit.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;

public class ApiKeyAuthenticationTest {

    @Test
    public void testCreateMethod() {
        String dummyKey = "key";
        ApiKeyAuth apiKeyAuthDTO = new ApiKeyAuth(dummyKey);
        ApiKeyAuthentication connection = ApiKeyAuthentication.create(apiKeyAuthDTO).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        assertEquals(dummyKey, connection.getKey());
    }
}
