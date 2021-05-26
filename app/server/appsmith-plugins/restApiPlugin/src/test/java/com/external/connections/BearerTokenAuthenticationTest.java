package com.external.connections;

import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.BearerTokenAuth;
import org.junit.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;

public class BearerTokenAuthenticationTest {

    @Test
    public void testCreateMethod() {
        String bearerToken = "key";
        BearerTokenAuth bearerTokenAuthDTO = new BearerTokenAuth(bearerToken);
        BearerTokenAuthentication connection = BearerTokenAuthentication.create(bearerTokenAuthDTO).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        assertEquals(bearerToken, connection.getBearerToken());
    }
}
