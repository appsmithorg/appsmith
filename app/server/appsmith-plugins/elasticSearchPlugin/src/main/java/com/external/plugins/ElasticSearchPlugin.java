package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.SmartSubstitutionHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.exceptions.ElasticSearchErrorMessages;
import com.external.plugins.exceptions.ElasticSearchPluginError;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.StatusLine;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.message.BasicHeader;
import org.apache.http.nio.entity.NStringEntity;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static org.apache.commons.lang3.StringUtils.isBlank;

public class ElasticSearchPlugin extends BasePlugin {

    private static final long ELASTIC_SEARCH_DEFAULT_PORT = 9200L;

    public ElasticSearchPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class ElasticSearchPluginExecutor implements PluginExecutor<RestClient>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        private static final Pattern patternForUnauthorized =
                Pattern.compile(".*unauthorized.*", Pattern.CASE_INSENSITIVE);

        private static final Pattern patternForNotFound =
                Pattern.compile(".*not.?found|refused|not.?known|timed?\\s?out.*", Pattern.CASE_INSENSITIVE);

        private static final Pattern SAFE_PATH_VALUE = Pattern.compile("[A-Za-z0-9._~-]+");

        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                RestClient client,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            String body = actionConfiguration.getBody();
            String path = actionConfiguration.getPath();
            try {
                if (body != null) {
                    List<MustacheBindingToken> bodyBindings = MustacheHelper.extractMustacheKeysInOrder(body);
                    if (!bodyBindings.isEmpty()) {
                        String preparedBody = MustacheHelper.replaceMustacheWithPlaceholder(body, bodyBindings);
                        body = (String) smartSubstitutionOfBindings(
                                preparedBody, bodyBindings, params(executeActionDTO), new ArrayList<>());
                        validateBody(body, isNdjsonQuery(path), isBulkQuery(path));
                    }
                }
                if (path != null) {
                    path = bindPath(path, params(executeActionDTO));
                }

            } catch (AppsmithPluginException | IllegalArgumentException | IOException e) {
                ActionExecutionResult result = new ActionExecutionResult();
                result.setIsExecutionSuccess(false);
                result.setErrorInfo(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        ElasticSearchErrorMessages.INVALID_BINDING_ERROR_MSG));
                return Mono.just(result);
            }

            // Generic substitution handles other fields without re-evaluating the request body or path.
            actionConfiguration.setBody(null);
            actionConfiguration.setPath(null);
            try {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
            } finally {
                actionConfiguration.setBody(body);
                actionConfiguration.setPath(path);
            }
            return execute(client, datasourceConfiguration, actionConfiguration);
        }

        @Override
        public Object substituteValueInInput(
                int index,
                String binding,
                String value,
                Object input,
                List<Map.Entry<String, String>> insertedParams,
                Object... args) {
            if (value == null || value.contains(SmartSubstitutionHelper.APPSMITH_SUBSTITUTION_PLACEHOLDER)) {
                throw new IllegalArgumentException();
            }
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(
                    (String) input, value, null, insertedParams, null, (Param) args[0]);
        }

        private static List<Param> params(ExecuteActionDTO executeActionDTO) {
            return executeActionDTO == null || executeActionDTO.getParams() == null
                    ? List.of()
                    : executeActionDTO.getParams();
        }

        private static String bindPath(String template, List<Param> params) {
            StringBuilder boundPath = new StringBuilder();
            boolean hasBinding = false;
            for (MustacheBindingToken token : MustacheHelper.tokenize(template)) {
                if (!token.getIncludesHandleBars()) {
                    boundPath.append(token.getValue());
                    continue;
                }
                hasBinding = true;
                String key = token.getValue()
                        .substring(2, token.getValue().length() - 2)
                        .trim();
                Param matchingParam = params.stream()
                        .filter(param -> param != null
                                && param.getKey() != null
                                && param.getKey().trim().equals(key))
                        .findFirst()
                        .orElse(null);
                String value = matchingParam == null ? null : matchingParam.getValue();
                if (value == null || !SAFE_PATH_VALUE.matcher(value).matches()) {
                    throw new IllegalArgumentException();
                }
                boundPath.append(value);
            }

            if (hasBinding) {
                String path = boundPath.toString().split("\\?", 2)[0];
                for (String segment : path.split("/", -1)) {
                    if (segment.equals(".") || segment.equals("..")) {
                        throw new IllegalArgumentException();
                    }
                }
                // Evaluated segments must not select Elasticsearch's reserved API names.
                String[] templateSegments = template.split("\\?", 2)[0].split("/", -1);
                String[] boundSegments = path.split("/", -1);
                if (templateSegments.length != boundSegments.length) {
                    throw new IllegalArgumentException();
                }
                for (int i = 0; i < templateSegments.length; i++) {
                    if (templateSegments[i].contains("{{") && boundSegments[i].startsWith("_")) {
                        throw new IllegalArgumentException();
                    }
                }
            }
            return boundPath.toString();
        }

        private static void validateBody(String body, boolean ndjson, boolean bulk) throws IOException {
            if (ndjson && !(bulk && body.trim().startsWith("["))) {
                boolean foundDocument = false;
                for (String line : body.split("\\R", -1)) {
                    if (!line.isBlank()) {
                        validateJsonDocument(line);
                        foundDocument = true;
                    }
                }
                if (!foundDocument) {
                    throw new IllegalArgumentException();
                }
            } else {
                validateJsonDocument(body);
            }
        }

        private static void validateJsonDocument(String body) throws IOException {
            try (JsonParser parser = objectMapper.createParser(body)) {
                JsonNode value = objectMapper.readTree(parser);
                if (value == null || parser.nextToken() != null) {
                    throw new IllegalArgumentException();
                }
            }
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                RestClient client,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName() + ": execute() called for ElasticSearch plugin.");
            final Map<String, Object> requestData = new HashMap<>();

            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams = new ArrayList<>();

            return Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName()
                                + ": creating action execution result from ElasticSearch plugin.");
                        final ActionExecutionResult result = new ActionExecutionResult();

                        String body = query;

                        final String path = actionConfiguration.getPath();
                        requestData.put("path", path);

                        HttpMethod httpMethod = actionConfiguration.getHttpMethod();
                        requestData.put("method", httpMethod.name());
                        requestParams.add(new RequestParamDTO(
                                "actionConfiguration.httpMethod", httpMethod.name(), null, null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));

                        final Request request = new Request(httpMethod.toString(), path);
                        ContentType contentType = ContentType.APPLICATION_JSON;

                        boolean bulkQuery = isBulkQuery(path);
                        boolean ndjsonQuery = bulkQuery || isMultiSearchQuery(path);
                        if (ndjsonQuery) {
                            contentType = ContentType.create("application/x-ndjson");
                        }

                        if (bulkQuery) {
                            // If body is a JSON Array, convert it to an ND-JSON string.
                            if (body != null && body.trim().startsWith("[")) {
                                final StringBuilder ndJsonBuilder = new StringBuilder();
                                try {
                                    List<Object> commands = objectMapper.readValue(body, ArrayList.class);
                                    for (Object object : commands) {
                                        ndJsonBuilder
                                                .append(objectMapper.writeValueAsString(object))
                                                .append("\n");
                                    }
                                } catch (IOException e) {
                                    final String message = "Error converting array to ND-JSON: " + e.getMessage();
                                    log.warn(message, e);
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                            ElasticSearchErrorMessages.ARRAY_TO_ND_JSON_ARRAY_CONVERSION_ERROR_MSG,
                                            e.getMessage()));
                                }
                                body = ndJsonBuilder.toString();
                            }
                        }

                        if (ndjsonQuery && body != null && !body.isEmpty() && !body.endsWith("\n")) {
                            body += "\n";
                        }

                        if (body != null) {
                            request.setEntity(new NStringEntity(body, contentType));
                        }

                        try {
                            final String responseBody = new String(client.performRequest(request)
                                    .getEntity()
                                    .getContent()
                                    .readAllBytes());
                            result.setBody(objectMapper.readValue(responseBody, HashMap.class));
                        } catch (IOException e) {
                            final String message = "Error performing request: " + e.getMessage();
                            log.warn(message, e);
                            return Mono.error(new AppsmithPluginException(
                                    ElasticSearchPluginError.QUERY_EXECUTION_FAILED,
                                    ElasticSearchErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    e.getMessage()));
                        }

                        result.setIsExecutionSuccess(true);
                        log.debug("In the Elastic Search Plugin, got action execution result");
                        return Mono.just(result);
                    })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
                    .onErrorResume(error -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    ElasticSearchPluginError.QUERY_EXECUTION_FAILED,
                                    ElasticSearchErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    error);
                        }
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
                    .map(result -> {
                        log.debug(Thread.currentThread().getName()
                                + ": setting the request in the result to be returned from ElasticSearch plugin.");
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setProperties(requestData);
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);
        }

        private static boolean isBulkQuery(String path) {
            return path != null && path.split("\\?", 2)[0].matches(".*\\b_bulk$");
        }

        private static boolean isMultiSearchQuery(String path) {
            if (path == null) {
                return false;
            }
            String requestPath = path.split("\\?", 2)[0];
            return requestPath.endsWith("/_msearch") || requestPath.endsWith("/_msearch/template");
        }

        private static boolean isNdjsonQuery(String path) {
            return isBulkQuery(path) || isMultiSearchQuery(path);
        }

        public Long getPort(Endpoint endpoint) {

            if (endpoint.getPort() == null) {
                return ELASTIC_SEARCH_DEFAULT_PORT;
            }

            return endpoint.getPort();
        }

        @Override
        public Mono<RestClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for ElasticSearch plugin.");
            final List<HttpHost> hosts = new ArrayList<>();

            for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                URL url;
                try {
                    url = new URL(endpoint.getHost());
                } catch (MalformedURLException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            ElasticSearchErrorMessages.DS_INVALID_HOST_ERROR_MSG));
                }
                String scheme = "http";
                if (url.getProtocol() != null) {
                    scheme = url.getProtocol();
                }

                hosts.add(new HttpHost(url.getHost(), getPort(endpoint).intValue(), scheme));
            }

            final RestClientBuilder clientBuilder = RestClient.builder(hosts.toArray(new HttpHost[] {}));

            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (authentication != null
                    && !StringUtils.isEmpty(authentication.getUsername())
                    && !StringUtils.isEmpty(authentication.getPassword())) {
                final CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
                credentialsProvider.setCredentials(
                        AuthScope.ANY,
                        new UsernamePasswordCredentials(authentication.getUsername(), authentication.getPassword()));

                clientBuilder.setHttpClientConfigCallback(
                        httpClientBuilder -> httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider));
            }

            if (!CollectionUtils.isEmpty(datasourceConfiguration.getHeaders())) {
                clientBuilder.setDefaultHeaders((Header[]) datasourceConfiguration.getHeaders().stream()
                        .map(h -> new BasicHeader(h.getKey(), (String) h.getValue()))
                        .toArray());
            }

            return Mono.fromCallable(clientBuilder::build).subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(RestClient client) {
            // Closing the low-level REST client is socket I/O; keep it off the caller thread like the other plugins.
            Mono.fromRunnable(() -> {
                        try {
                            client.close();
                        } catch (IOException e) {
                            log.warn("Error closing connection to ElasticSearch.", e);
                        }
                    })
                    .subscribeOn(scheduler)
                    .subscribe(ignored -> {}, error -> log.error("Error closing connection to ElasticSearch.", error));
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for ElasticSearch plugin.");
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add(ElasticSearchErrorMessages.DS_NO_ENDPOINT_ERROR_MSG);
            } else {
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {

                    if (endpoint.getHost() == null) {
                        invalids.add(ElasticSearchErrorMessages.DS_MISSING_HOST_ERROR_MSG);
                    } else {
                        try {
                            new URL(endpoint.getHost());
                        } catch (MalformedURLException e) {
                            invalids.add(ElasticSearchErrorMessages.DS_INVALID_HOST_ERROR_MSG);
                        }
                    }
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(RestClient connection) {
            log.debug(Thread.currentThread().getName() + ": testDatasource() called for ElasticSearch plugin.");
            return Mono.fromCallable(() -> {
                        if (connection == null) {
                            return new DatasourceTestResult("Null client object to ElasticSearch.");
                        }
                        // This HEAD request is to check if the base of datasource exists. It responds with 200 if the
                        // index exists, 404 if it doesn't. We just check for either of these two.
                        // Ref: https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-exists.html
                        Request request = new Request("HEAD", "/");

                        final Response response;
                        try {
                            response = connection.performRequest(request);
                        } catch (IOException e) {
                            final String message = e.getMessage();

                            /* since the 401, and 403 are registered as IOException, but for the given connection it
                             * in the current rest-client. We will figure out with matching patterns with regexes.
                             */

                            if (patternForUnauthorized.matcher(message).find()) {
                                return new DatasourceTestResult(ElasticSearchErrorMessages.UNAUTHORIZED_ERROR_MSG);
                            }

                            if (patternForNotFound.matcher(message).find()) {
                                return new DatasourceTestResult(ElasticSearchErrorMessages.NOT_FOUND_ERROR_MSG);
                            }

                            return new DatasourceTestResult("Error running HEAD request: " + message);
                        }

                        final StatusLine statusLine = response.getStatusLine();

                        // earlier it was 404 and 200, now it has been changed to just expect 200 status code
                        // here it checks if it is anything else than 200, even 404 is not allowed!
                        if (statusLine.getStatusCode() == 404) {
                            return new DatasourceTestResult(ElasticSearchErrorMessages.NOT_FOUND_ERROR_MSG);
                        }

                        if (statusLine.getStatusCode() != 200) {
                            return new DatasourceTestResult("Unexpected response from ElasticSearch: " + statusLine);
                        }

                        return new DatasourceTestResult();
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<String> getEndpointIdentifierForRateLimit(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName()
                    + ": getEndpointIdentifierForRateLimit() called for ElasticSearch plugin.");
            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            String identifier = "";
            // When hostname and port both are available, both will be used as identifier
            // When port is not present, default port along with hostname will be used
            // This ensures rate limiting will only be applied if hostname is present
            if (endpoints.size() > 0) {
                String hostName = endpoints.get(0).getHost();
                Long port = endpoints.get(0).getPort();
                if (!isBlank(hostName)) {
                    identifier = hostName + "_" + ObjectUtils.defaultIfNull(port, ELASTIC_SEARCH_DEFAULT_PORT);
                }
            }
            return Mono.just(identifier);
        }
    }
}
