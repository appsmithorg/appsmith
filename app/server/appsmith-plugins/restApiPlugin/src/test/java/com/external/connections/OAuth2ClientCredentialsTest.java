package com.external.connections;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.OAuth2;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
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
@PrepareForTest(OAuth2ClientCredentials.class)
public class OAuth2ClientCredentialsTest {

    @Test
    public void testNullConnection() {
        APIConnection connection = OAuth2ClientCredentials.create(null).block(Duration.ofMillis(100));
        assertThat(connection).isNull();
    }

    @Test
    public void testValidConnection() {
        OAuth2 oAuth2 = new OAuth2();
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        oAuth2.setIsTokenHeader(true);
        authenticationResponse.setToken("SomeToken");
        authenticationResponse.setExpiresAt(Instant.now().plusSeconds(1200));
        oAuth2.setAuthenticationResponse(authenticationResponse);
        OAuth2ClientCredentials connection = OAuth2ClientCredentials.create(oAuth2).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        assertThat(connection.getExpiresAt()).isEqualTo(authenticationResponse.getExpiresAt());
        assertThat(connection.getToken()).isEqualTo("SomeToken");
    }

    @Test
    public void testStaleFilter() {
        OAuth2 oAuth2 = new OAuth2();
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        oAuth2.setIsTokenHeader(true);
        authenticationResponse.setToken("SomeToken");
        authenticationResponse.setExpiresAt(Instant.now().plusSeconds(1200));
        oAuth2.setAuthenticationResponse(authenticationResponse);
        OAuth2ClientCredentials connection = OAuth2ClientCredentials.create(oAuth2).block(Duration.ofMillis(100));
        connection.setExpiresAt(Instant.now());

        Mono<ClientResponse> response = connection.filter(Mockito.mock(ClientRequest.class), Mockito.mock(ExchangeFunction.class));

        StepVerifier.create(response)
                .expectError(StaleConnectionException.class);
    }

}
