package com.external.connections;

import com.appsmith.external.models.ApiKeyAuth;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;

public class ApiKeyAuthenticationTest {

    @Test
    public void testCreateMethodWithQueryParamsLabel() {
        String label = "label";
        String value = "value";
        ApiKeyAuth.Type type = ApiKeyAuth.Type.QUERY_PARAMS;
        ApiKeyAuth apiKeyAuthDTO = new ApiKeyAuth(type, label, null, value);
        Mono<ApiKeyAuthentication> connectionMono = ApiKeyAuthentication.create(apiKeyAuthDTO);
        StepVerifier.create(connectionMono)
                .assertNext(connection -> {
                    assertThat(connection).isNotNull();
                    assertEquals(value, connection.getValue());
                })
                .verifyComplete();
    }
}