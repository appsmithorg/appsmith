package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.SSLHelper;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.constants.ResponseDataType;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.netty.http.HttpProtocol;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;

import static org.apache.commons.lang3.StringUtils.isNotEmpty;
import static org.springframework.util.CollectionUtils.isEmpty;

@NoArgsConstructor
@Component
public class RestAPIActivateUtils {
    @Value("${appsmith.integration.provider.signing.key}")
    private String integrationProviderSigningKey =
            "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";

    public static final String SIGNATURE_HEADER_NAME = "X-APPSMITH-SIGNATURE";
    public static final String RESPONSE_DATA_TYPE = "X-APPSMITH-DATATYPE";
    public static final int MAX_REDIRECTS = 5;
    public static final Set BINARY_DATA_TYPES = Set.of(
            "application/zip",
            "application/octet-stream",
            "application/pdf",
            "application/pkcs8",
            "application/x-binary");
    public static HeaderUtils headerUtils = new HeaderUtils();

    public Mono<ActionExecutionResult> triggerApiCall(
            WebClient client,
            HttpMethod httpMethod,
            URI uri,
            Object requestBody,
            ActionExecutionRequest actionExecutionRequest,
            ObjectMapper objectMapper,
            Set<String> hintMessages,
            ActionExecutionResult errorResult,
            RequestCaptureFilter requestCaptureFilter,
            DatasourceConfiguration datasourceConfiguration) {
        return httpCall(client, httpMethod, uri, requestBody, 0)
                .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                .map(stringResponseEntity -> {
                    HttpHeaders headers = stringResponseEntity.getHeaders();
                    /*
                       Find the media type of the response to parse the body as required. In case the content-type
                       header is not present in the response then set it to our default i.e. "text/plain" although
                       the RFC 7231 standard suggests assuming "application/octet-stream" content-type in case
                       it's not present in response header.
                    */
                    MediaType contentType = headers.getContentType();
                    if (contentType == null) {
                        contentType = MediaType.TEXT_PLAIN;
                    }
                    byte[] body = stringResponseEntity.getBody();
                    HttpStatusCode statusCode = stringResponseEntity.getStatusCode();

                    ActionExecutionResult result = new ActionExecutionResult();

                    // Set the request fields
                    boolean isBodySentWithApiRequest = requestBody == null ? false : true;
                    result.setRequest(requestCaptureFilter.populateRequestFields(
                            actionExecutionRequest, isBodySentWithApiRequest, datasourceConfiguration));

                    result.setStatusCode(statusCode.toString());

                    // if something has moved permanently should we mark it as an execution failure?
                    // here marking a redirection as an execution success if the url has moved permanently without a
                    // forwarding Location
                    boolean isExecutionSuccess = statusCode.is2xxSuccessful() || statusCode.is3xxRedirection();
                    result.setIsExecutionSuccess(isExecutionSuccess);

                    // Convert the headers into json tree to store in the results
                    String headerInJsonString;
                    try {
                        headerInJsonString = objectMapper.writeValueAsString(headers);
                    } catch (JsonProcessingException e) {
                        throw Exceptions.propagate(e);
                    }

                    // Set headers in the result now
                    try {
                        result.setHeaders(objectMapper.readTree(headerInJsonString));
                    } catch (IOException e) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, headerInJsonString, e.getMessage()));
                    }

                    if (body != null) {

                        ResponseDataType responseDataType = ResponseDataType.UNDEFINED;

                        /**TODO
                         * Handle XML response. Currently we only handle JSON & Image responses. The other kind of responses
                         * are kept as is and returned as a string.
                         */
                        if (contentType.includes(MediaType.APPLICATION_JSON)) {
                            try {
                                String jsonBody = new String(body, StandardCharsets.UTF_8);
                                result.setBody(objectMapper.readTree(jsonBody));
                                responseDataType = ResponseDataType.JSON;
                            } catch (IOException e) {
                                System.out.println("Unable to parse response JSON. Setting response body as string.");
                                String bodyString = new String(body, StandardCharsets.UTF_8);
                                result.setBody(bodyString.trim());

                                // Warn user that the API response is not a valid JSON.
                                hintMessages.add("The response returned by this API is not a valid JSON. Please "
                                        + "be careful when using the API response anywhere a valid JSON is required"
                                        + ". You may resolve this issue either by modifying the 'Content-Type' "
                                        + "Header to indicate a non-JSON response or by modifying the API response "
                                        + "to return a valid JSON.");
                            }
                        } else if (MediaType.IMAGE_GIF.equals(contentType)
                                || MediaType.IMAGE_JPEG.equals(contentType)
                                || MediaType.IMAGE_PNG.equals(contentType)) {
                            String encode = Base64.getEncoder().encodeToString(body);
                            result.setBody(encode);
                            responseDataType = ResponseDataType.IMAGE;

                        } else if (BINARY_DATA_TYPES.contains(contentType.toString())) {
                            String encode = Base64.getEncoder().encodeToString(body);
                            result.setBody(encode);
                            responseDataType = ResponseDataType.BINARY;
                        } else {
                            // If the body is not of JSON type, just set it as is.
                            String bodyString = new String(body, StandardCharsets.UTF_8);
                            result.setBody(bodyString.trim());
                            responseDataType = ResponseDataType.TEXT;
                        }

                        // Now add a new header which specifies the data type of the response as per Appsmith
                        JsonNode headersJsonNode = result.getHeaders();
                        ObjectNode headersObjectNode = (ObjectNode) headersJsonNode;
                        headersObjectNode.putArray(RESPONSE_DATA_TYPE).add(String.valueOf(responseDataType));
                        result.setHeaders(headersObjectNode);
                    }

                    result.setMessages(hintMessages);
                    return result;
                });
    }

    protected Mono<ClientResponse> httpCall(
            WebClient webClient, HttpMethod httpMethod, URI uri, Object requestBody, int iteration) {
        if (iteration == MAX_REDIRECTS) {
            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR, "Exceeded the HTTP redirect limits of " + MAX_REDIRECTS));
        }

        /**
         * requestBody is expected to be null when a GET request type is used with no content-type header.
         */
        if (requestBody != null) {
            assert requestBody instanceof BodyInserter<?, ?>;
        }
        BodyInserter<?, ?> finalRequestBody = (BodyInserter<?, ?>) requestBody;

        return webClient
                .method(httpMethod)
                .uri(uri)
                .body((BodyInserter<?, ? super ClientHttpRequest>) finalRequestBody)
                .exchange()
                .flatMap(response -> {
                    if (response.statusCode().is3xxRedirection()) {
                        // if there is no redirect location then we should just return the response
                        if (CollectionUtils.isEmpty(response.headers().header(HttpHeaders.LOCATION))) {
                            return Mono.just(response);
                        }

                        String redirectUrl =
                                response.headers().header("Location").get(0);

                        final URI redirectUri;
                        try {
                            redirectUri = createRedirectUrl(redirectUrl, uri);
                        } catch (IllegalArgumentException e) {
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                        }

                        return httpCall(webClient, httpMethod, redirectUri, finalRequestBody, iteration + 1);
                    }
                    return Mono.just(response);
                });
    }

    public URI createRedirectUrl(String redirectUrl, URI originalUrl) {
        return originalUrl.resolve(redirectUrl);
    }

    public WebClient getWebClient(
            WebClient.Builder webClientBuilder,
            APIConnection apiConnection,
            String reqContentType,
            ExchangeStrategies EXCHANGE_STRATEGIES,
            RequestCaptureFilter requestCaptureFilter) {
        // Right before building the webclient object, we populate it with whatever mutation the APIConnection object
        // demands
        if (apiConnection != null) {
            webClientBuilder.filter(apiConnection);
        }

        if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
            webClientBuilder.filter(new BufferingFilter());
        }

        webClientBuilder.filter(requestCaptureFilter);

        return webClientBuilder.exchangeStrategies(EXCHANGE_STRATEGIES).build();
    }

    public WebClient.Builder getWebClientBuilder(
            ActionConfiguration actionConfiguration, DatasourceConfiguration datasourceConfiguration) {
        HttpClient httpClient = getHttpClient(datasourceConfiguration, actionConfiguration.getHttpVersion());
        WebClient.Builder webClientBuilder = WebClientUtils.builder(httpClient);
        addAllHeaders(webClientBuilder, actionConfiguration, datasourceConfiguration);
        addSecretKey(webClientBuilder, datasourceConfiguration);

        return webClientBuilder;
    }

    private PrivateKey getPrivateKey() throws Exception {
        // Decode the Base64-encoded private key
        byte[] keyBytes = Base64.getDecoder().decode(integrationProviderSigningKey);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);

        // Generate an RSA private key from the key specification
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(keySpec);
    }

    public String generateWorkspaceJWT(String workspaceId) throws Exception {
        // Get the RSA private key
        PrivateKey privateKey = getPrivateKey();

        // Define the current time and expiration for the token
        final Instant now = Instant.now();

        // Build and sign the token with RS256 algorithm
        final String token = Jwts.builder()
                .setIssuer("Appsmith") // Token issuer
                .setSubject(workspaceId) // Subject is the workspaceId
                .setIssuedAt(new Date(now.toEpochMilli())) // Set issued at time
                .setExpiration(new Date(now.plusSeconds(86400).toEpochMilli())) // Token expiration (1 day later)
                .signWith(privateKey, SignatureAlgorithm.RS256) // Sign with RSA private key
                .compact(); // Build the token

        return token;
    }

    protected void addSecretKey(WebClient.Builder webClientBuilder, DatasourceConfiguration datasourceConfiguration)
            throws AppsmithPluginException {
        // If users have chosen to share the Appsmith signature in the header, calculate and add that
        String secretKey;
        secretKey = headerUtils.getSignatureKey(datasourceConfiguration);

        if (secretKey != null) {
            final SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
            final Instant now = Instant.now();
            final String token = Jwts.builder()
                    .setIssuer("Appsmith")
                    .setIssuedAt(new Date(now.toEpochMilli()))
                    .setExpiration(new Date(now.plusSeconds(600).toEpochMilli()))
                    .signWith(key)
                    .compact();

            webClientBuilder.defaultHeader(SIGNATURE_HEADER_NAME, token);
        }
    }

    protected void addAllHeaders(
            WebClient.Builder webClientBuilder,
            ActionConfiguration actionConfiguration,
            DatasourceConfiguration datasourceConfiguration) {
        /**
         * First, check if headers are defined in API datasource and add them.
         */
        if (!isEmpty(datasourceConfiguration.getHeaders())) {
            addHeaders(webClientBuilder, datasourceConfiguration.getHeaders());
        }

        /**
         * If headers are defined in API action config, then add them too.
         * In case there is a conflict with the datasource headers then the header defined in the API action config
         * will override it.
         */
        if (!isEmpty(actionConfiguration.getHeaders())) {
            addHeaders(webClientBuilder, actionConfiguration.getHeaders());
        }
    }

    protected void addHeaders(WebClient.Builder webClientBuilder, List<Property> headers) {
        headers.stream()
                .filter(header -> isNotEmpty(header.getKey()))
                .forEach(header -> webClientBuilder.defaultHeader(header.getKey(), (String) header.getValue()));
    }

    protected HttpClient getHttpClient(DatasourceConfiguration datasourceConfiguration, HttpProtocol httpProtocol) {
        if (httpProtocol == null) {
            httpProtocol = HttpProtocol.HTTP11;
        }
        // Initializing webClient to be used for http call
        final ConnectionProvider provider = ConnectionProvider.builder("rest-api-provider")
                .maxIdleTime(Duration.ofSeconds(600))
                .maxLifeTime(Duration.ofSeconds(600))
                .build();

        HttpClient httpClient = HttpClient.create(provider)
                .protocol(httpProtocol)
                .secure(SSLHelper.sslCheckForHttpClient(datasourceConfiguration))
                .compress(true);

        return httpClient;
    }
}
