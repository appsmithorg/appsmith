package com.external.connections;

import com.appsmith.external.models.BearerTokenAuth;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;

public class BearerTokenAuthenticationTest {

    @Test
    public void testCreateMethod() {
        String bearerToken = "key";
        BearerTokenAuth bearerTokenAuthDTO = new BearerTokenAuth(bearerToken);
        Mono<BearerTokenAuthentication> connectionMono = BearerTokenAuthentication.create(bearerTokenAuthDTO);
        StepVerifier.create(connectionMono)
                .assertNext(connection -> {
                    assertThat(connection).isNotNull();
                    assertEquals(bearerToken, connection.getBearerToken());
                })
                .verifyComplete();
    }
}