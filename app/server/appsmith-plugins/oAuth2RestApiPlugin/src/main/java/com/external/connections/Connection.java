package com.external.connections;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.UpdatableConnection;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * This interface represents all the behaviour required to "handle" a connection to a REST API. Depending on the type of
 * connection, implementations may choose to navigate this handling as they deem fit. Since these connections will make
 * use of their own WebClient instances, the lifecycle of each request will be managed automatically
 * The Connection interface also has a reference to a builder that determines which type of connection a REST API will
 * need, based on: TODO On what basis do we create the builder pattern?
 */
@Slf4j
public class Connection implements UpdatableConnection {

    private WebClient webClient = null;
    private OAuth2AccessToken token = null;
    private ClientRegistration clientRegistration;
    private String requestContentType;
    private String requestBody;
    private boolean updated;

    private static final int MAX_REDIRECTS = 5;
    private static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    private Connection() {
        this.updated = false;
    }

    OAuth2AccessToken getToken() {
        return this.token;
    }

    OAuth2AccessToken setToken(OAuth2AccessToken token) {
        this.token = token;
        this.updated = true;
        return this.token;
    }

    private void setToken(OAuth2 authentication) {
        if (authentication.getToken() != null && !authentication.getToken().isBlank()) {
            this.token = new OAuth2AccessToken(
                    OAuth2AccessToken.TokenType.BEARER,
                    authentication.getToken(),
                    null,
                    authentication.getExpiresAt(),
                    Set.of(authentication.getScope()));
        }
    }

    public static Connection createConnection(DatasourceConfiguration datasourceConfiguration) {
        Connection connection = new Connection();
        connection.buildClientRegistration((OAuth2) datasourceConfiguration.getAuthentication());
        connection.setToken((OAuth2) datasourceConfiguration.getAuthentication());
        connection.buildWebClient();
        return connection;
    }

    private void buildClientRegistration(OAuth2 authentication) {
        this.clientRegistration = ClientRegistration
                .withRegistrationId("test")
                .clientId(authentication.getClientId())
                .clientSecret(authentication.getClientSecret())
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .tokenUri(authentication.getAccessTokenUrl())
                .build();
    }

    private void buildWebClient() {
        this.webClient = WebClient.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .filter(new Oauth2ExchangeFunction(this))
                .build();
    }

    public ClientRegistration getClientRegistration() {
        return this.clientRegistration;
    }

    public void addRequestHeaders(List<Property> headers) {
        WebClient.Builder webClientBuilder = this.webClient.mutate();
        String contentType = "";

        for (Property header : headers) {
            String key = header.getKey();
            if (StringUtils.isNotEmpty(key)) {
                String value = header.getValue();
                webClientBuilder.defaultHeader(key, value);

                if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(key)) {
                    contentType = value;
                }
            }
        }
        this.webClient = webClientBuilder.build();
        this.requestContentType = contentType;
    }

    public void addRequestBody(ActionConfiguration actionConfiguration) {
        this.requestBody = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();

        if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(this.requestContentType)
                || MediaType.MULTIPART_FORM_DATA_VALUE.equals(this.requestContentType)) {
            this.requestBody = convertPropertyListToReqBody(actionConfiguration.getBodyFormData());
        }
    }

    // TODO testConnection and executeConnection
    public Mono<ClientResponse> execute(HttpMethod httpMethod, URI uri,
                                        int iteration) {
        if (iteration == MAX_REDIRECTS) {
            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Exceeded the HTTP redirect limits of " + MAX_REDIRECTS
            ));
        }

        if (MediaType.APPLICATION_JSON_VALUE.equals(this.requestContentType)) {
            try {
                objectFromJson(this.requestBody);
            } catch (JsonSyntaxException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Malformed JSON: " + e.getMessage()
                ));
            }
        }

        return webClient
                .method(httpMethod)
                .uri(uri)
                .body(BodyInserters.fromObject(this.requestBody))
                .exchange()
                .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                .flatMap(response -> {
                    if (response.statusCode().is3xxRedirection()) {
                        String redirectUrl = response.headers().header("Location").get(0);
                        /**
                         * TODO
                         * In case the redirected URL is not absolute (complete), create the new URL using the relative path
                         * This particular scenario is seen in the URL : https://rickandmortyapi.com/api/character
                         * It redirects to partial URI : /api/character/
                         * In this scenario we should convert the partial URI to complete URI
                         */
                        URI redirectUri = null;
                        try {
                            redirectUri = new URI(redirectUrl);
                        } catch (URISyntaxException e) {
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                        }
                        return execute(httpMethod, redirectUri, iteration + 1);
                    }
                    return Mono.just(response);
                });
    }

    private static Object objectFromJson(String jsonString) {
        Class<?> type;
        String trimmed = jsonString.trim();

        if (trimmed.startsWith("{")) {
            type = Map.class;
        } else if (trimmed.startsWith("[")) {
            type = List.class;
        } else {
            // The JSON body is likely a literal boolean or number or string. For our purposes here, we don't have
            // to parse this JSON.
            return null;
        }

        return new GsonBuilder().create().fromJson(jsonString, type);
    }

    private String convertPropertyListToReqBody(List<Property> bodyFormData) {
        if (bodyFormData == null || bodyFormData.isEmpty()) {
            return "";
        }

        String reqBody = bodyFormData.stream()
                .map(property -> property.getKey() + "=" + property.getValue())
                .collect(Collectors.joining("&"));
        return reqBody;
    }

    @Override
    public void updateDatasource(DatasourceConfiguration datasourceConfiguration) {
        OAuth2 auth = (OAuth2) datasourceConfiguration.getAuthentication();
        auth.setToken(this.token.getTokenValue());
        auth.setExpiresAt(this.token.getExpiresAt());
    }

    @Override
    public boolean isUpdated() {
        return updated;
    }
}
