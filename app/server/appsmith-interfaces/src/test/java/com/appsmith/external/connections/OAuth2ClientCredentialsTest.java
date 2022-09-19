package com.appsmith.external.connections;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.connections.OAuth2ClientCredentials;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import okio.Buffer;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.EOFException;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@PowerMockIgnore("javax.net.ssl.*")
@RunWith(PowerMockRunner.class)
@PrepareForTest(OAuth2ClientCredentials.class)
public class OAuth2ClientCredentialsTest {

    private static MockWebServer mockEndpoint;

    @BeforeClass
    public static void setUp() throws IOException {
        mockEndpoint = new MockWebServer();
        mockEndpoint.start();
    }

    @AfterClass
    public static void tearDown() throws IOException {
        mockEndpoint.shutdown();
    }

    @Test
    public void testNullConnection() {
        APIConnection connection = OAuth2ClientCredentials.create(null).block(Duration.ofMillis(100));
        assertThat(connection).isNull();
    }

    @Test
    public void testValidConnection() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();
        datasourceConfiguration.setAuthentication(oAuth2);
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        oAuth2.setIsTokenHeader(true);
        authenticationResponse.setToken("SomeToken");
        authenticationResponse.setExpiresAt(Instant.now().plusSeconds(1200));
        oAuth2.setAuthenticationResponse(authenticationResponse);
        OAuth2ClientCredentials connection = OAuth2ClientCredentials.create(datasourceConfiguration).block(Duration.ofMillis(100));
        assertThat(connection).isNotNull();
        assertThat(connection.getExpiresAt()).isEqualTo(authenticationResponse.getExpiresAt());
        assertThat(connection.getToken()).isEqualTo("SomeToken");
    }

    @Test
    public void testStaleFilter() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();
        datasourceConfiguration.setAuthentication(oAuth2);
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        oAuth2.setIsTokenHeader(true);
        authenticationResponse.setToken("SomeToken");
        authenticationResponse.setExpiresAt(Instant.now().plusSeconds(1200));
        oAuth2.setAuthenticationResponse(authenticationResponse);
        OAuth2ClientCredentials connection = OAuth2ClientCredentials.create(datasourceConfiguration).block(Duration.ofMillis(100));
        connection.setExpiresAt(Instant.now());

        Mono<ClientResponse> response = connection.filter(Mockito.mock(ClientRequest.class), Mockito.mock(ExchangeFunction.class));

        StepVerifier.create(response)
                .expectError(StaleConnectionException.class);
    }

    @Test
    public void testCreate_withIsAuthorizationHeaderTrue_sendsCredentialsInHeader() throws InterruptedException {
        String baseUrl = String.format("http://localhost:%s", mockEndpoint.getPort());

        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();
        datasourceConfiguration.setAuthentication(oAuth2);
        oAuth2.setIsAuthorizationHeader(true);
        oAuth2.setGrantType(OAuth2.Type.CLIENT_CREDENTIALS);
        oAuth2.setAccessTokenUrl(baseUrl);
        oAuth2.setClientId("testId");
        oAuth2.setClientSecret("testSecret");

        mockEndpoint
                .enqueue(new MockResponse()
                        .setBody("{}")
                        .addHeader("Content-Type", "application/json"));

        final OAuth2ClientCredentials response = OAuth2ClientCredentials.create(datasourceConfiguration).block();
        final RecordedRequest recordedRequest = mockEndpoint.takeRequest(30, TimeUnit.SECONDS);

        final String authorizationHeader = recordedRequest.getHeader("Authorization");
        Assert.assertNotNull(authorizationHeader);
        Assert.assertEquals("Basic dGVzdElkOnRlc3RTZWNyZXQ=", authorizationHeader);
    }

    @Test
    public void testCreate_withIsAuthorizationHeaderFalse_sendsCredentialsInBody() throws InterruptedException, EOFException {
        String baseUrl = String.format("http://localhost:%s", mockEndpoint.getPort());

        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();
        datasourceConfiguration.setAuthentication(oAuth2);
        oAuth2.setGrantType(OAuth2.Type.CLIENT_CREDENTIALS);
        oAuth2.setAccessTokenUrl(baseUrl);
        oAuth2.setClientId("testId");
        oAuth2.setClientSecret("testSecret");

        mockEndpoint
                .enqueue(new MockResponse()
                        .setBody("{}")
                        .addHeader("Content-Type", "application/json"));

        final OAuth2ClientCredentials response = OAuth2ClientCredentials.create(datasourceConfiguration).block();
        final RecordedRequest recordedRequest = mockEndpoint.takeRequest(30, TimeUnit.SECONDS);

        final String authorizationHeader = recordedRequest.getHeader("Authorization");
        Assert.assertNull(authorizationHeader);

        final Buffer recordedRequestBody = recordedRequest.getBody();
        byte[] bodyBytes = new byte[(int) recordedRequestBody.size()];
        recordedRequestBody.readFully(bodyBytes);
        recordedRequestBody.close();
        Assert.assertEquals("grant_type=client_credentials&client_id=testId&client_secret=testSecret", new String(bodyBytes));
    }
}
