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
import io.jsonwebtoken.security.Keys;
import io.micrometer.observation.ObservationRegistry;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Exceptions;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;
import reactor.netty.http.HttpProtocol;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;

import static com.appsmith.external.constants.spans.ce.ActionSpanCE.ACTUAL_API_CALL;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;
import static org.springframework.util.CollectionUtils.isEmpty;

@NoArgsConstructor
public class RestAPIActivateUtils {

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
            DatasourceConfiguration datasourceConfiguration,
            ObservationRegistry observationRegistry) {
        return httpCall(client, httpMethod, uri, requestBody, 0)
                .name(ACTUAL_API_CALL)
                .tap(Micrometer.observation(observationRegistry))
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
