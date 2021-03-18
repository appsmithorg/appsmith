package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.connections.APIConnection;
import com.external.connections.APIConnectionFactory;
import com.external.helpers.DatasourceValidator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.JsonSyntaxException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.apache.commons.lang.StringUtils;
import org.bson.internal.Base64;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

public class RestApiPlugin extends BasePlugin {
    private static final int MAX_REDIRECTS = 5;

    private static final int SMART_JSON_SUBSTITUTION_INDEX = 0;

    // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
    // `WebClient` instance was loaded as an auto-wired bean.
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor<APIConnection> {

        private final String IS_SEND_SESSION_ENABLED_KEY = "isSendSessionEnabled";
        private final String SESSION_SIGNATURE_KEY_KEY = "sessionSignatureKey";
        private final String SIGNATURE_HEADER_NAME = "X-APPSMITH-SIGNATURE";

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * also update the datasource and action configuration for pagination and some minor cleanup of the configuration before execution
         *
         * @param connection              : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(APIConnection connection,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {

            Boolean smartJsonSubstitution;

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            if (CollectionUtils.isEmpty(properties)) {
                /**
                 * TODO :
                 * In case the smart json substitution configuration is missing, default to true once smart json
                 * substitution is no longer in beta.
                 */
                smartJsonSubstitution = false;
            } else {
                // Since properties is not empty, we are guaranteed to find the first property.
                smartJsonSubstitution = Boolean.parseBoolean(properties.get(SMART_JSON_SUBSTITUTION_INDEX).getValue());
            }

            // Smartly substitute in actionConfiguration.body and replace all the bindings with values.
            if (TRUE.equals(smartJsonSubstitution)) {
                // Do smart replacements in JSON body
                if (actionConfiguration.getBody() != null) {
                    // First extract all the bindings in order
                    List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(actionConfiguration.getBody());
                    // Replace all the bindings with a ? as expected in a prepared statement.
                    String updatedBody = MustacheHelper.replaceMustacheWithQuestionMark(actionConfiguration.getBody(), mustacheKeysInOrder);

                    if (mustacheKeysInOrder != null && !mustacheKeysInOrder.isEmpty()) {

                        List<Param> params = executeActionDTO.getParams();
                        List<String> parameters = new ArrayList<>();

                        for (int i = 0; i < mustacheKeysInOrder.size(); i++) {
                            String key = mustacheKeysInOrder.get(i);
                            Optional<Param> matchingParam = params.stream().filter(param -> param.getKey().trim().equals(key)).findFirst();

                            // If the evaluated value of the mustache binding is present, set it in the prepared statement
                            if (matchingParam.isPresent()) {
                                String value = matchingParam.get().getValue();
                                parameters.add(value);
                                updatedBody = DataTypeStringUtils.jsonSmartReplacementQuestionWithValue(updatedBody, value);
                            }
                        }
                    }
                    actionConfiguration.setBody(updatedBody);
                }
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            // If the action is paginated, update the configurations to update the correct URL.
            if (actionConfiguration != null &&
                    actionConfiguration.getPaginationType() != null &&
                    PaginationType.URL.equals(actionConfiguration.getPaginationType()) &&
                    executeActionDTO.getPaginationField() != null) {
                datasourceConfiguration = updateDatasourceConfigurationForPagination(actionConfiguration, datasourceConfiguration, executeActionDTO.getPaginationField());
                actionConfiguration = updateActionConfigurationForPagination(actionConfiguration, executeActionDTO.getPaginationField());
            }
            // Filter out any empty headers
            if (actionConfiguration.getHeaders() != null && !actionConfiguration.getHeaders().isEmpty()) {
                List<Property> headerList = actionConfiguration.getHeaders().stream()
                        .filter(header -> !org.springframework.util.StringUtils.isEmpty(header.getKey()))
                        .collect(Collectors.toList());
                actionConfiguration.setHeaders(headerList);
            }

            return this.execute(connection, datasourceConfiguration, actionConfiguration);
        }

        @Override
        public Mono<ActionExecutionResult> execute(APIConnection apiConnection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
            errorResult.setIsExecutionSuccess(false);

            // Initializing request URL
            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = datasourceConfiguration.getUrl() + path;
            String reqContentType = "";

            /*
             * - If encodeParamsToggle is null, then assume it to be true because params are supposed to be
             *   encoded by default, unless explicitly prohibited by the user.
             */
            Boolean encodeParamsToggle = true;
            if (actionConfiguration.getEncodeParamsToggle() != null
                    && actionConfiguration.getEncodeParamsToggle() == false) {
                encodeParamsToggle = false;
            }

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            URI uri;
            try {
                String httpUrl = addHttpToUrlWhenPrefixNotPresent(url);
                uri = createFinalUriWithQueryParams(httpUrl,
                        actionConfiguration.getQueryParameters(),
                        encodeParamsToggle);
            } catch (URISyntaxException e) {
                ActionExecutionRequest actionExecutionRequest = populateRequestFields(actionConfiguration, null);
                actionExecutionRequest.setUrl(url);
                errorResult.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage(e));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            ActionExecutionRequest actionExecutionRequest = populateRequestFields(actionConfiguration, uri);

            if (httpMethod == null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage("HTTPMethod must be set."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            // Initializing webClient to be used for http call
            WebClient.Builder webClientBuilder = WebClient.builder();

            // Adding headers from datasource
            if (datasourceConfiguration.getHeaders() != null) {
                reqContentType = addHeadersToRequestAndGetContentType(
                        webClientBuilder, datasourceConfiguration.getHeaders());
            }

            if (actionConfiguration.getHeaders() != null) {
                reqContentType = addHeadersToRequestAndGetContentType(
                        webClientBuilder, actionConfiguration.getHeaders());
            }

            // Check for content type
            final String contentTypeError = verifyContentType(actionConfiguration.getHeaders());
            if (contentTypeError != null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage("Invalid value for Content-Type."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            String requestBodyAsString = "";

            // Add request body only for non GET calls.
            if (!HttpMethod.GET.equals(httpMethod)) {
                // Adding request body
                requestBodyAsString = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();

                if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                        || MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
                    requestBodyAsString = convertPropertyListToReqBody(actionConfiguration.getBodyFormData(),
                            reqContentType,
                            encodeParamsToggle);
                }
            }

            // If users have chosen to share the Appsmith signature in the header, calculate and add that
            String secretKey;
            try {
                secretKey = getSignatureKey(datasourceConfiguration);
            } catch (AppsmithPluginException e) {
                return Mono.error(e);
            }

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

            // Right before building the webclient object, we populate it with whatever mutation the APIConnection object demands
            if (apiConnection != null) {
                webClientBuilder.filter(apiConnection);
            }

            WebClient client = webClientBuilder.exchangeStrategies(EXCHANGE_STRATEGIES).filter(logRequest()).build();

            // Triggering the actual REST API call
            return httpCall(client, httpMethod, uri, requestBodyAsString, 0, reqContentType)
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .map(stringResponseEntity -> {
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        // Find the media type of the response to parse the body as required.
                        MediaType contentType = headers.getContentType();
                        byte[] body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();

                        // Set the request fields
                        result.setRequest(actionExecutionRequest);

                        result.setStatusCode(statusCode.toString());
                        result.setIsExecutionSuccess(statusCode.is2xxSuccessful());

                        // Convert the headers into json tree to store in the results
                        String headerInJsonString;
                        try {
                            headerInJsonString = objectMapper.writeValueAsString(headers);
                        } catch (JsonProcessingException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                        }

                        // Set headers in the result now
                        try {
                            result.setHeaders(objectMapper.readTree(headerInJsonString));
                        } catch (IOException e) {
                            throw Exceptions.propagate(
                                    new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                            headerInJsonString,
                                            e.getMessage()
                                    )
                            );
                        }

                        if (body != null) {
                            /**TODO
                             * Handle XML response. Currently we only handle JSON & Image responses. The other kind of responses
                             * are kept as is and returned as a string.
                             */
                            if (MediaType.APPLICATION_JSON.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8.equals(contentType)) {
                                try {
                                    String jsonBody = new String(body);
                                    result.setBody(objectMapper.readTree(jsonBody));
                                } catch (IOException e) {
                                    throw Exceptions.propagate(
                                            new AppsmithPluginException(
                                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                                    new String(body),
                                                    e.getMessage()
                                            )
                                    );
                                }
                            } else if (MediaType.IMAGE_GIF.equals(contentType) ||
                                    MediaType.IMAGE_JPEG.equals(contentType) ||
                                    MediaType.IMAGE_PNG.equals(contentType)) {
                                String encode = Base64.encode(body);
                                result.setBody(encode);
                            } else {
                                // If the body is not of JSON type, just set it as is.
                                String bodyString = new String(body);
                                result.setBody(bodyString.trim());
                            }
                        }

                        return result;
                    })
                    .onErrorResume(error  -> {
                        errorResult.setIsExecutionSuccess(false);
                        if (error instanceof AppsmithPluginException) {
                            errorResult.setStatusCode(((AppsmithPluginException) error).getAppErrorCode().toString());
                        }
                        errorResult.setBody(error.getMessage());
                        return Mono.just(errorResult);
                    });
        }

        private static ExchangeFilterFunction logRequest() {
            return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
                log.info("Request: {} {}", clientRequest.method(), clientRequest.url());
                clientRequest.headers().forEach((name, values) -> values.forEach(value -> System.out.println(name + "=" + value)));
                return Mono.just(clientRequest);
            });
        }

        private String getSignatureKey(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
            if (!CollectionUtils.isEmpty(datasourceConfiguration.getProperties())) {
                boolean isSendSessionEnabled = false;
                String secretKey = null;

                for (Property property : datasourceConfiguration.getProperties()) {
                    if (IS_SEND_SESSION_ENABLED_KEY.equals(property.getKey())) {
                        isSendSessionEnabled = "Y".equals(property.getValue());
                    } else if (SESSION_SIGNATURE_KEY_KEY.equals(property.getKey())) {
                        secretKey = property.getValue();
                    }
                }

                if (isSendSessionEnabled) {
                    if (StringUtils.isEmpty(secretKey) || secretKey.length() < 32) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Secret key is required when sending session details is switched on," +
                                        " and should be at least 32 characters in length."
                        );
                    }
                    return secretKey;
                }
            }

            return null;
        }

        public String convertPropertyListToReqBody(List<Property> bodyFormData,
                                                   String reqContentType,
                                                   Boolean encodeParamsToggle) {
            if (bodyFormData == null || bodyFormData.isEmpty()) {
                return "";
            }

            String reqBody = bodyFormData.stream()
                    .map(property -> {
                        String key = property.getKey();
                        String value = property.getValue();

                        if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                                && encodeParamsToggle == true) {
                            try {
                                value = URLEncoder.encode(value, StandardCharsets.UTF_8.toString());
                            } catch (UnsupportedEncodingException e) {
                                throw new UnsupportedOperationException(e);
                            }
                        }

                        return key + "=" + value;
                    })
                    .collect(Collectors.joining("&"));

            return reqBody;
        }

        /**
         * If the headers list of properties contains a `Content-Type` header, verify if the value of that header is a
         * valid media type.
         *
         * @param headers List of header Property objects to look for Content-Type headers in.
         * @return An error message string if the Content-Type value is invalid, otherwise `null`.
         */
        private static String verifyContentType(List<Property> headers) {
            if (headers == null) {
                return null;
            }

            for (Property header : headers) {
                if (header.getKey().equalsIgnoreCase(HttpHeaders.CONTENT_TYPE)) {
                    try {
                        MediaType.valueOf(header.getValue());
                    } catch (InvalidMediaTypeException e) {
                        return e.getMessage();
                    }
                    // Don't break here since there can be multiple `Content-Type` headers.
                }
            }

            return null;
        }

        private Mono<ClientResponse> httpCall(WebClient webClient, HttpMethod httpMethod, URI uri, Object requestBody,
                                              int iteration, String contentType) {
            if (iteration == MAX_REDIRECTS) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Exceeded the HTTP redirect limits of " + MAX_REDIRECTS
                ));
            }

            if (MediaType.APPLICATION_JSON_VALUE.equals(contentType)) {
                try {
                    if (requestBody instanceof String) {
                        Object objectFromJson = objectFromJson((String) requestBody);
                        if (objectFromJson != null) {
                            requestBody = objectFromJson;
                        }
                    }
                } catch (JsonSyntaxException | ParseException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                            requestBody,
                            "Malformed JSON: " + e.getMessage()
                    ));
                }
            }

            Object finalRequestBody = requestBody;

            return webClient
                    .method(httpMethod)
                    .uri(uri)
                    .body(BodyInserters.fromObject(requestBody))
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
                            return httpCall(webClient, httpMethod, redirectUri, finalRequestBody, iteration + 1,
                                    contentType);
                        }
                        return Mono.just(response);
                    });
        }

        /**
         * Given a JSON string, we infer the top-level type of the object it represents and then parse it into that
         * type. However, only `Map` and `List` top-levels are supported. Note that the map or list may contain
         * anything, like booleans or number or even more maps or lists. It's only that the top-level type should be a
         * map / list.
         *
         * @param jsonString A string that confirms to JSON syntax. Shouldn't be null.
         * @return An object of type `Map`, `List`, if applicable, or `null`.
         */
        private static Object objectFromJson(String jsonString) throws ParseException {
            Class<?> type;
            String trimmed = jsonString.trim();

            if (trimmed.startsWith("{")) {
                type = Map.class;
            } else if (trimmed.startsWith("[")) {
                type = List.class;
            } else {
                return null;
            }

            JSONParser jsonParser = new JSONParser(JSONParser.MODE_PERMISSIVE);
            Object parsedJson = null;

            if (type.equals(List.class)) {
                parsedJson = (JSONArray) jsonParser.parse(jsonString);
            } else {
                parsedJson = (JSONObject) jsonParser.parse(jsonString);
            }

            return parsedJson;

        }

        @Override
        public Mono<APIConnection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return APIConnectionFactory.createConnection(datasourceConfiguration.getAuthentication());
        }

        @Override
        public void datasourceDestroy(APIConnection connection) {
            // REST API plugin doesn't have a datasource.
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            // We don't verify whether the URL is in valid format because it can contain mustache template keys, and so
            // look invalid at this point, but become valid after mustache rendering. So we just check if URL field has
            // a non-empty value.

            Set<String> invalids = new HashSet<>();

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                invalids.add("Missing URL.");
            }

            final String contentTypeError = verifyContentType(datasourceConfiguration.getHeaders());
            if (contentTypeError != null) {
                invalids.add("Invalid Content-Type: " + contentTypeError);
            }

            if (!CollectionUtils.isEmpty(datasourceConfiguration.getProperties())) {
                boolean isSendSessionEnabled = false;
                String secretKey = null;

                for (Property property : datasourceConfiguration.getProperties()) {
                    if ("isSendSessionEnabled".equals(property.getKey())) {
                        isSendSessionEnabled = "Y".equals(property.getValue());
                    } else if ("sessionSignatureKey".equals(property.getKey())) {
                        secretKey = property.getValue();
                    }
                }

                if (isSendSessionEnabled && (StringUtils.isEmpty(secretKey) || secretKey.length() < 32)) {
                    invalids.add("Secret key is required when sending session is switched on" +
                            ", and should be at least 32 characters long.");
                }
            }

            try {
                getSignatureKey(datasourceConfiguration);
            } catch (AppsmithPluginException e) {
                invalids.add(e.getMessage());
            }

            if (datasourceConfiguration.getAuthentication() != null) {
                invalids.addAll(DatasourceValidator.validateAuthentication(datasourceConfiguration.getAuthentication()));
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            // At this point, the URL can be invalid because of mustache template keys inside it. Hence, connecting to
            // and verifying the URL isn't feasible. Since validation happens just before testing, and since validation
            // checks if a URL is present, there's nothing left to do here, but return a successful response.
            return Mono.just(new DatasourceTestResult());
        }

        private String addHeadersToRequestAndGetContentType(WebClient.Builder webClientBuilder,
                                                            List<Property> headers) {
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
            return contentType;
        }

        private String addHttpToUrlWhenPrefixNotPresent(String url) {
            if (url == null || url.toLowerCase().startsWith("http") || url.contains("://")) {
                return url;
            }
            return "http://" + url;
        }

        private URI createFinalUriWithQueryParams(String url,
                                                  List<Property> queryParams,
                                                  Boolean encodeParamsToggle) throws URISyntaxException {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            uriBuilder.uri(new URI(url));

            if (queryParams != null) {
                for (Property queryParam : queryParams) {
                    String key = queryParam.getKey();
                    if (StringUtils.isNotEmpty(key)) {
                        if (encodeParamsToggle == true) {
                            uriBuilder.queryParam(
                                    URLEncoder.encode(key, StandardCharsets.UTF_8),
                                    URLEncoder.encode(queryParam.getValue(), StandardCharsets.UTF_8)
                            );
                        } else {
                            uriBuilder.queryParam(
                                    key,
                                    queryParam.getValue()
                            );
                        }
                    }
                }
            }
            return uriBuilder.build(true).toUri();
        }

        private ActionExecutionRequest populateRequestFields(ActionConfiguration actionConfiguration,
                                                             URI uri) {

            ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();

            if (actionConfiguration.getHeaders() != null) {
                MultiValueMap<String, String> reqMultiMap = CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));

                actionConfiguration.getHeaders().stream()
                        .forEach(header -> reqMultiMap.put(header.getKey(), Arrays.asList(header.getValue())));
                actionExecutionRequest.setHeaders(objectMapper.valueToTree(reqMultiMap));
            }

            // If the body is set, then use that field as the request body by default
            if (actionConfiguration.getBody() != null) {
                actionExecutionRequest.setBody(actionConfiguration.getBody());
            }

            if (actionConfiguration.getHttpMethod() != null) {
                actionExecutionRequest.setHttpMethod(actionConfiguration.getHttpMethod());
            }

            if (uri != null) {
                actionExecutionRequest.setUrl(uri.toString());
            }

            log.debug("Got request in actionExecutionResult as: {}", actionExecutionRequest);
            return actionExecutionRequest;
        }

        private ActionConfiguration updateActionConfigurationForPagination(ActionConfiguration actionConfiguration,
                                                                           PaginationField paginationField) {
            if (PaginationField.NEXT.equals(paginationField) || PaginationField.PREV.equals(paginationField)) {
                actionConfiguration.setPath("");
                actionConfiguration.setQueryParameters(null);
            }
            return actionConfiguration;
        }

        private DatasourceConfiguration updateDatasourceConfigurationForPagination(ActionConfiguration actionConfiguration,
                                                                                   DatasourceConfiguration datasourceConfiguration,
                                                                                   PaginationField paginationField) {
            if (PaginationField.NEXT.equals(paginationField)) {
                if (actionConfiguration.getNext() == null) {
                    datasourceConfiguration.setUrl(null);
                } else {
                    datasourceConfiguration.setUrl(URLDecoder.decode(actionConfiguration.getNext(), StandardCharsets.UTF_8));
                }
            } else if (PaginationField.PREV.equals(paginationField)) {
                datasourceConfiguration.setUrl(actionConfiguration.getPrev());
            }
            return datasourceConfiguration;
        }
    }

}