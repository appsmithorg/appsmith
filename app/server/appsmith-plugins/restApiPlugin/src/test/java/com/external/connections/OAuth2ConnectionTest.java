package com.external.connections;

import com.appsmith.external.models.OAuth2;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;


@RunWith(PowerMockRunner.class)
@PrepareForTest(OAuth2Connection.class)
public class OAuth2ConnectionTest {

    @Test
    public void testNullConnection() {
        APIConnection connection = OAuth2Connection.create(null).block(Duration.ofMillis(100));
        assertThat(connection).isNull();
    }

    @Test
    public void testValidConnection() {
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setIsHeader(true);
        oAuth2.setToken("SomeToken");
        oAuth2.setIsEncrypted(false);
        oAuth2.setExpiresAt(Instant.now().plusSeconds(1200));
        OAuth2Connection connection = OAuth2Connection.create(oAuth2).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        assertThat(connection.getExpiresAt()).isEqualTo(oAuth2.getExpiresAt());
        assertThat(connection.getHeaderPrefix()).isEqualTo("Bearer");
        assertThat(connection.getToken()).isEqualTo("SomeToken");
    }

    @Test
    public void testStaleFilter() {
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setIsHeader(true);
        oAuth2.setToken("SomeToken");
        oAuth2.setIsEncrypted(false);
        oAuth2.setExpiresAt(Instant.now().plusSeconds(1200));
        OAuth2Connection connection = OAuth2Connection.create(oAuth2).block(Duration.ofMillis(100));
        connection.setExpiresAt(Instant.now());

        Mono<ClientResponse> response = connection.filter(Mockito.mock(ClientRequest.class), Mockito.mock(ExchangeFunction.class));

        StepVerifier.create(response)
                .expectError(StaleConnectionException.class);
    }

}
