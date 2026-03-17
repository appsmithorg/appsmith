package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.util.WebClientUtils;
import com.external.plugins.exceptions.SeaTableErrorMessages;
import com.external.plugins.exceptions.SeaTablePluginError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.constants.FieldName.BODY;
import static com.external.constants.FieldName.COMMAND;
import static com.external.constants.FieldName.DIRECTION;
import static com.external.constants.FieldName.LIMIT;
import static com.external.constants.FieldName.OFFSET;
import static com.external.constants.FieldName.ORDER_BY;
import static com.external.constants.FieldName.ROW_ID;
import static com.external.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.constants.FieldName.SQL;
import static com.external.constants.FieldName.TABLE_NAME;
import static java.lang.Boolean.TRUE;

/**
 * SeaTable plugin for Appsmith.
 *
 * <p>SeaTable API flow:
 * <ol>
 *   <li>Exchange API-Token for a Base-Token (access_token) via GET /api/v2.1/dtable/app-access-token/
 *       Response includes: access_token, dtable_uuid, dtable_server</li>
 *   <li>All row/metadata/sql operations use the dtable_server URL:
 *       {dtable_server}/api/v2/dtables/{dtable_uuid}/...
 *       with header: Authorization: Token {access_token}</li>
 * </ol>
 *
 * @see <a href="https://api.seatable.com/">SeaTable API Reference</a>
 */
public class SeaTablePlugin extends BasePlugin {

    private static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);

    public SeaTablePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class SeaTablePluginExecutor implements PluginExecutor<Void>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        /**
         * Holds the result of the access token exchange.
         * The basePath is pre-computed as {dtableServer}/api/v2/dtables/{dtableUuid}
         * so that command methods can simply append their endpoint path.
         */
        private record AccessTokenResponse(String accessToken, String basePath) {}

        /**
         * @deprecated Use {@link #executeParameterized} instead.
         */
        @Override
        @Deprecated
        public Mono<ActionExecutionResult> execute(
                Void connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            return Mono.error(new AppsmithPluginException(
                    SeaTablePluginError.QUERY_EXECUTION_FAILED, "Unsupported Operation"));
        }

        @Override
        public Object substituteValueInInput(
                int index,
                String binding,
                String value,
                Object input,
                List<Map.Entry<String, String>> insertedParams,
                Object... args) {
            String jsonBody = (String) input;
            Param param = (Param) args[0];
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(
                    jsonBody, value, null, insertedParams, null, param);
        }

        /**
         * Main entry point for query execution. Handles smart JSON substitution
         * for the body field, then delegates to {@link #executeQuery}.
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                Void connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName()
                    + ": executeParameterized() called for SeaTable plugin.");

            final Map<String, Object> formData = actionConfiguration.getFormData();

            // Handle smart substitution for the body field
            boolean smartJsonSubstitution = TRUE;
            Object smartSubObj = formData != null ? formData.getOrDefault(SMART_SUBSTITUTION, TRUE) : TRUE;
            if (smartSubObj instanceof Boolean) {
                smartJsonSubstitution = (Boolean) smartSubObj;
            } else if (smartSubObj instanceof String) {
                smartJsonSubstitution = Boolean.parseBoolean((String) smartSubObj);
            }

            List<Map.Entry<String, String>> parameters = new ArrayList<>();
            if (TRUE.equals(smartJsonSubstitution)) {
                String body = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE);
                if (body != null) {
                    List<MustacheBindingToken> mustacheKeysInOrder =
                            MustacheHelper.extractMustacheKeysInOrder(body);
                    String updatedBody =
                            MustacheHelper.replaceMustacheWithPlaceholder(body, mustacheKeysInOrder);

                    try {
                        List<Param> params = executeActionDTO.getParams();
                        if (params == null) {
                            params = new ArrayList<>();
                        }
                        updatedBody = (String) smartSubstitutionOfBindings(
                                updatedBody,
                                mustacheKeysInOrder,
                                params,
                                parameters);
                    } catch (AppsmithPluginException e) {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(e);
                        return Mono.just(errorResult);
                    }

                    setDataValueSafelyInFormData(formData, BODY, updatedBody);
                }
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            return this.executeQuery(datasourceConfiguration, actionConfiguration);
        }

        /**
         * Dispatches the query to the appropriate command handler based on the
         * selected command in the form data.
         */
        private Mono<ActionExecutionResult> executeQuery(
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            final Map<String, Object> formData = actionConfiguration.getFormData();
            final String command = getDataValueSafelyFromFormData(formData, COMMAND, STRING_TYPE);

            if (StringUtils.isBlank(command)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_COMMAND_ERROR_MSG));
            }

            // Validate required fields before making any network calls
            Mono<Void> validation = validateCommandInputs(command, formData);
            if (validation != null) {
                return validation.then(Mono.empty());
            }

            return fetchAccessToken(datasourceConfiguration)
                    .flatMap(tokenResponse -> {
                        String basePath = tokenResponse.basePath();
                        String accessToken = tokenResponse.accessToken();

                        return switch (command) {
                            case "LIST_ROWS" -> executeListRows(basePath, accessToken, formData);
                            case "GET_ROW" -> executeGetRow(basePath, accessToken, formData);
                            case "CREATE_ROW" -> executeCreateRow(basePath, accessToken, formData);
                            case "UPDATE_ROW" -> executeUpdateRow(basePath, accessToken, formData);
                            case "DELETE_ROW" -> executeDeleteRow(basePath, accessToken, formData);
                            case "LIST_TABLES" -> executeListTables(basePath, accessToken);
                            case "SQL_QUERY" -> executeSqlQuery(basePath, accessToken, formData);
                            default -> Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Unknown command: " + command));
                        };
                    });
        }

        /**
         * Exchanges the API-Token for a Base-Token (access token).
         *
         * <p>Calls GET {serverUrl}/api/v2.1/dtable/app-access-token/ with the API token.
         * The response always includes access_token, dtable_uuid, and dtable_server.
         * The dtable_server URL already includes /api-gateway/.
         *
         * @param datasourceConfiguration the datasource config containing server URL and API token
         * @return an {@link AccessTokenResponse} with the access token and pre-computed base path
         */
        private Mono<AccessTokenResponse> fetchAccessToken(DatasourceConfiguration datasourceConfiguration) {
            if (datasourceConfiguration.getUrl() == null || datasourceConfiguration.getUrl().isBlank()) {
                return Mono.error(new AppsmithPluginException(
                        SeaTablePluginError.ACCESS_TOKEN_ERROR,
                        SeaTableErrorMessages.MISSING_SERVER_URL_ERROR_MSG));
            }
            if (datasourceConfiguration.getAuthentication() == null
                    || !(datasourceConfiguration.getAuthentication() instanceof DBAuth auth)
                    || StringUtils.isBlank(auth.getPassword())) {
                return Mono.error(new AppsmithPluginException(
                        SeaTablePluginError.ACCESS_TOKEN_ERROR,
                        SeaTableErrorMessages.MISSING_API_TOKEN_ERROR_MSG));
            }

            String serverUrl = datasourceConfiguration.getUrl().trim();
            String apiToken = auth.getPassword();

            if (serverUrl.endsWith("/")) {
                serverUrl = serverUrl.substring(0, serverUrl.length() - 1);
            }

            WebClient client = WebClientUtils.builder()
                    .exchangeStrategies(EXCHANGE_STRATEGIES)
                    .build();

            final String url = serverUrl + "/api/v2.1/dtable/app-access-token/";

            return client
                    .get()
                    .uri(URI.create(url))
                    .header("Authorization", "Token " + apiToken)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .timeout(REQUEST_TIMEOUT)
                    .map(responseBytes -> {
                        try {
                            JsonNode json = objectMapper.readTree(responseBytes);

                            JsonNode accessTokenNode = json.get("access_token");
                            JsonNode dtableUuidNode = json.get("dtable_uuid");
                            JsonNode dtableServerNode = json.get("dtable_server");

                            if (accessTokenNode == null || dtableUuidNode == null || dtableServerNode == null) {
                                throw Exceptions.propagate(new AppsmithPluginException(
                                        SeaTablePluginError.ACCESS_TOKEN_ERROR,
                                        SeaTableErrorMessages.ACCESS_TOKEN_FETCH_FAILED_ERROR_MSG));
                            }

                            String accessToken = accessTokenNode.asText();
                            String dtableUuid = dtableUuidNode.asText();
                            String dtableServer = dtableServerNode.asText();

                            // dtable_server is e.g. "https://cloud.seatable.io/api-gateway/"
                            // Build the base path for all subsequent API calls
                            if (!dtableServer.endsWith("/")) {
                                dtableServer = dtableServer + "/";
                            }
                            String basePath = dtableServer + "api/v2/dtables/" + dtableUuid;

                            return new AccessTokenResponse(accessToken, basePath);
                        } catch (IOException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(
                                    SeaTablePluginError.ACCESS_TOKEN_ERROR,
                                    SeaTableErrorMessages.ACCESS_TOKEN_FETCH_FAILED_ERROR_MSG));
                        }
                    })
                    .onErrorResume(e -> {
                        if (e instanceof AppsmithPluginException) {
                            return Mono.error(e);
                        }
                        return Mono.error(new AppsmithPluginException(
                                SeaTablePluginError.ACCESS_TOKEN_ERROR,
                                SeaTableErrorMessages.ACCESS_TOKEN_FETCH_FAILED_ERROR_MSG));
                    })
                    .subscribeOn(scheduler);
        }

        /**
         * Builds an HTTP request against the SeaTable API without a request body.
         */
        private WebClient.RequestHeadersSpec<?> buildRequest(
                String basePath, String accessToken, HttpMethod method, String path) {
            return buildRequest(basePath, accessToken, method, path, null);
        }

        /**
         * Builds an HTTP request against the SeaTable API with an optional JSON request body.
         */
        private WebClient.RequestHeadersSpec<?> buildRequest(
                String basePath, String accessToken, HttpMethod method, String path, String body) {

            WebClient client = WebClientUtils.builder()
                    .exchangeStrategies(EXCHANGE_STRATEGIES)
                    .build();

            String url = basePath + path;

            WebClient.RequestBodySpec requestSpec = client
                    .method(method)
                    .uri(URI.create(url))
                    .header("Authorization", "Token " + accessToken)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE);

            if (body != null) {
                return requestSpec
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromValue(body));
            }

            return requestSpec;
        }

        /**
         * Executes an HTTP request and maps the response to an {@link ActionExecutionResult}.
         * Applies a timeout and handles errors uniformly.
         */
        private Mono<ActionExecutionResult> executeRequest(WebClient.RequestHeadersSpec<?> requestSpec) {
            return requestSpec
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .timeout(REQUEST_TIMEOUT)
                    .map(responseBytes -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(true);
                        try {
                            JsonNode jsonBody = objectMapper.readTree(responseBytes);
                            result.setBody(jsonBody);
                        } catch (IOException e) {
                            result.setBody(new String(responseBytes));
                        }
                        return result;
                    })
                    .onErrorResume(e -> {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(new AppsmithPluginException(
                                SeaTablePluginError.QUERY_EXECUTION_FAILED,
                                String.format(
                                        SeaTableErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                        e.getMessage())));
                        return Mono.just(errorResult);
                    })
                    .subscribeOn(scheduler);
        }

        /**
         * Validates required form fields for a command before making network calls.
         * Returns a Mono.error if validation fails, or null if validation passes.
         */
        private Mono<Void> validateCommandInputs(String command, Map<String, Object> formData) {
            String tableName = getDataValueSafelyFromFormData(formData, TABLE_NAME, STRING_TYPE, "");
            String rowId = getDataValueSafelyFromFormData(formData, ROW_ID, STRING_TYPE, "");
            String sql = getDataValueSafelyFromFormData(formData, SQL, STRING_TYPE, "");

            switch (command) {
                case "LIST_ROWS":
                case "CREATE_ROW":
                    if (StringUtils.isBlank(tableName)) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
                    }
                    break;
                case "GET_ROW":
                case "UPDATE_ROW":
                case "DELETE_ROW":
                    if (StringUtils.isBlank(tableName)) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
                    }
                    if (StringUtils.isBlank(rowId)) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                SeaTableErrorMessages.MISSING_ROW_ID_ERROR_MSG));
                    }
                    break;
                case "SQL_QUERY":
                    if (StringUtils.isBlank(sql)) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                SeaTableErrorMessages.MISSING_SQL_ERROR_MSG));
                    }
                    break;
                default:
                    // LIST_TABLES and unknown commands need no pre-validation
                    break;
            }
            return null;
        }

        // --- Command implementations ---

        /**
         * Lists rows from a table.
         * GET /api/v2/dtables/{base_uuid}/rows/?table_name=X&amp;convert_keys=true&amp;limit=N&amp;start=N&amp;order_by=col&amp;direction=asc
         */
        private Mono<ActionExecutionResult> executeListRows(
                String basePath, String accessToken, Map<String, Object> formData) {

            String tableName = getDataValueSafelyFromFormData(formData, TABLE_NAME, STRING_TYPE, "");
            if (StringUtils.isBlank(tableName)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
            }

            StringBuilder pathBuilder = new StringBuilder("/rows/");
            pathBuilder.append("?table_name=").append(PluginUtils.urlEncode(tableName));
            pathBuilder.append("&convert_keys=true");

            String limit = getDataValueSafelyFromFormData(formData, LIMIT, STRING_TYPE, "");
            if (StringUtils.isNotBlank(limit)) {
                pathBuilder.append("&limit=").append(PluginUtils.urlEncode(limit));
            }

            String offset = getDataValueSafelyFromFormData(formData, OFFSET, STRING_TYPE, "");
            if (StringUtils.isNotBlank(offset)) {
                pathBuilder.append("&start=").append(PluginUtils.urlEncode(offset));
            }

            String orderBy = getDataValueSafelyFromFormData(formData, ORDER_BY, STRING_TYPE, "");
            if (StringUtils.isNotBlank(orderBy)) {
                pathBuilder.append("&order_by=").append(PluginUtils.urlEncode(orderBy));
                String direction = getDataValueSafelyFromFormData(formData, DIRECTION, STRING_TYPE, "asc");
                pathBuilder.append("&direction=").append(PluginUtils.urlEncode(direction));
                // direction only works when start and limit are set too
                if (StringUtils.isBlank(limit)) {
                    pathBuilder.append("&limit=1000");
                }
                if (StringUtils.isBlank(offset)) {
                    pathBuilder.append("&start=0");
                }
            }

            return executeRequest(buildRequest(basePath, accessToken, HttpMethod.GET, pathBuilder.toString()));
        }

        /**
         * Gets a single row by ID.
         * GET /api/v2/dtables/{base_uuid}/rows/{row_id}/?table_name=X&amp;convert_keys=true
         */
        private Mono<ActionExecutionResult> executeGetRow(
                String basePath, String accessToken, Map<String, Object> formData) {

            String tableName = getDataValueSafelyFromFormData(formData, TABLE_NAME, STRING_TYPE, "");
            String rowId = getDataValueSafelyFromFormData(formData, ROW_ID, STRING_TYPE, "");

            if (StringUtils.isBlank(tableName)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
            }
            if (StringUtils.isBlank(rowId)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_ROW_ID_ERROR_MSG));
            }

            String path = "/rows/" + PluginUtils.urlEncode(rowId)
                    + "/?table_name=" + PluginUtils.urlEncode(tableName)
                    + "&convert_keys=true";

            return executeRequest(buildRequest(basePath, accessToken, HttpMethod.GET, path));
        }

        /**
         * Creates a new row in a table.
         * POST /api/v2/dtables/{base_uuid}/rows/
         * Body: { "table_name": "X", "rows": [{ "col": "val", ... }] }
         */
        private Mono<ActionExecutionResult> executeCreateRow(
                String basePath, String accessToken, Map<String, Object> formData) {

            String tableName = getDataValueSafelyFromFormData(formData, TABLE_NAME, STRING_TYPE, "");
            String body = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE, "");

            if (StringUtils.isBlank(tableName)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
            }

            String requestBody;
            try {
                JsonNode rowData = objectMapper.readTree(StringUtils.isBlank(body) ? "{}" : body);
                ObjectNode wrapper = objectMapper.createObjectNode();
                wrapper.put("table_name", tableName);
                ArrayNode rowsArray = objectMapper.createArrayNode();
                rowsArray.add(rowData);
                wrapper.set("rows", rowsArray);
                requestBody = objectMapper.writeValueAsString(wrapper);
            } catch (JsonProcessingException e) {
                return Mono.error(new AppsmithPluginException(
                        SeaTablePluginError.INVALID_BODY_ERROR,
                        "Invalid JSON in row object: " + e.getMessage()));
            }

            return executeRequest(
                    buildRequest(basePath, accessToken, HttpMethod.POST, "/rows/", requestBody));
        }

        /**
         * Updates an existing row.
         * PUT /api/v2/dtables/{base_uuid}/rows/
         * Body: { "table_name": "X", "updates": [{ "row_id": "...", "row": { "col": "val" } }] }
         */
        private Mono<ActionExecutionResult> executeUpdateRow(
                String basePath, String accessToken, Map<String, Object> formData) {

            String tableName = getDataValueSafelyFromFormData(formData, TABLE_NAME, STRING_TYPE, "");
            String rowId = getDataValueSafelyFromFormData(formData, ROW_ID, STRING_TYPE, "");
            String body = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE, "");

            if (StringUtils.isBlank(tableName)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
            }
            if (StringUtils.isBlank(rowId)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_ROW_ID_ERROR_MSG));
            }

            String requestBody;
            try {
                JsonNode rowData = objectMapper.readTree(StringUtils.isBlank(body) ? "{}" : body);

                ObjectNode updateEntry = objectMapper.createObjectNode();
                updateEntry.put("row_id", rowId);
                updateEntry.set("row", rowData);

                ArrayNode updatesArray = objectMapper.createArrayNode();
                updatesArray.add(updateEntry);

                ObjectNode wrapper = objectMapper.createObjectNode();
                wrapper.put("table_name", tableName);
                wrapper.set("updates", updatesArray);
                requestBody = objectMapper.writeValueAsString(wrapper);
            } catch (JsonProcessingException e) {
                return Mono.error(new AppsmithPluginException(
                        SeaTablePluginError.INVALID_BODY_ERROR,
                        "Invalid JSON in row object: " + e.getMessage()));
            }

            return executeRequest(
                    buildRequest(basePath, accessToken, HttpMethod.PUT, "/rows/", requestBody));
        }

        /**
         * Deletes a row from a table.
         * DELETE /api/v2/dtables/{base_uuid}/rows/
         * Body: { "table_name": "X", "row_ids": ["row_id_1"] }
         */
        private Mono<ActionExecutionResult> executeDeleteRow(
                String basePath, String accessToken, Map<String, Object> formData) {

            String tableName = getDataValueSafelyFromFormData(formData, TABLE_NAME, STRING_TYPE, "");
            String rowId = getDataValueSafelyFromFormData(formData, ROW_ID, STRING_TYPE, "");

            if (StringUtils.isBlank(tableName)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_TABLE_NAME_ERROR_MSG));
            }
            if (StringUtils.isBlank(rowId)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_ROW_ID_ERROR_MSG));
            }

            String requestBody;
            try {
                ObjectNode wrapper = objectMapper.createObjectNode();
                wrapper.put("table_name", tableName);
                ArrayNode rowIdsArray = objectMapper.createArrayNode();
                rowIdsArray.add(rowId);
                wrapper.set("row_ids", rowIdsArray);
                requestBody = objectMapper.writeValueAsString(wrapper);
            } catch (JsonProcessingException e) {
                return Mono.error(new AppsmithPluginException(
                        SeaTablePluginError.INVALID_BODY_ERROR,
                        "Failed to build delete request: " + e.getMessage()));
            }

            return executeRequest(
                    buildRequest(basePath, accessToken, HttpMethod.DELETE, "/rows/", requestBody));
        }

        /**
         * Lists all tables and their columns (metadata) in the connected base.
         * GET /api/v2/dtables/{base_uuid}/metadata/
         */
        private Mono<ActionExecutionResult> executeListTables(String basePath, String accessToken) {
            return executeRequest(
                    buildRequest(basePath, accessToken, HttpMethod.GET, "/metadata/"));
        }

        /**
         * Executes a SQL query against the base.
         * POST /api/v2/dtables/{base_uuid}/sql/
         * Body: { "sql": "SELECT ...", "convert_keys": true }
         */
        private Mono<ActionExecutionResult> executeSqlQuery(
                String basePath, String accessToken, Map<String, Object> formData) {

            String sql = getDataValueSafelyFromFormData(formData, SQL, STRING_TYPE, "");
            if (StringUtils.isBlank(sql)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SeaTableErrorMessages.MISSING_SQL_ERROR_MSG));
            }

            String requestBody;
            try {
                ObjectNode wrapper = objectMapper.createObjectNode();
                wrapper.put("sql", sql);
                wrapper.put("convert_keys", true);
                requestBody = objectMapper.writeValueAsString(wrapper);
            } catch (JsonProcessingException e) {
                return Mono.error(new AppsmithPluginException(
                        SeaTablePluginError.INVALID_BODY_ERROR,
                        "Failed to build SQL request: " + e.getMessage()));
            }

            return executeRequest(
                    buildRequest(basePath, accessToken, HttpMethod.POST, "/sql/", requestBody));
        }

        // --- Datasource lifecycle ---

        /**
         * SeaTable is stateless HTTP - no persistent connection to create.
         */
        @Override
        public Mono<Void> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty().then();
        }

        /**
         * Nothing to destroy for stateless HTTP connections.
         */
        @Override
        public void datasourceDestroy(Void connection) {
            // Nothing to destroy for stateless HTTP
        }

        /**
         * Validates the datasource configuration by checking that the server URL
         * and API token are present and well-formed.
         *
         * @param datasourceConfiguration the config to validate
         * @return a set of validation error messages (empty if valid)
         */
        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (StringUtils.isBlank(datasourceConfiguration.getUrl())) {
                invalids.add(SeaTableErrorMessages.MISSING_SERVER_URL_ERROR_MSG);
            } else {
                String url = datasourceConfiguration.getUrl().trim();
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    invalids.add(SeaTableErrorMessages.INVALID_SERVER_URL_ERROR_MSG);
                }
            }

            if (datasourceConfiguration.getAuthentication() == null
                    || !(datasourceConfiguration.getAuthentication() instanceof DBAuth)
                    || StringUtils.isBlank(((DBAuth) datasourceConfiguration.getAuthentication()).getPassword())) {
                invalids.add(SeaTableErrorMessages.MISSING_API_TOKEN_ERROR_MSG);
            }

            return invalids;
        }

        /**
         * Tests the datasource by attempting to fetch an access token.
         * If the token exchange succeeds, the datasource is valid.
         */
        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return fetchAccessToken(datasourceConfiguration)
                    .map(tokenResponse -> new DatasourceTestResult())
                    .onErrorResume(error -> {
                        String errorMessage = error.getMessage() == null
                                ? SeaTableErrorMessages.ACCESS_TOKEN_FETCH_FAILED_ERROR_MSG
                                : error.getMessage();
                        return Mono.just(new DatasourceTestResult(errorMessage));
                    });
        }

        /**
         * Fetches the structure (tables and columns) of the connected base
         * by calling the metadata endpoint. Used for schema discovery in the Appsmith UI.
         */
        @Override
        public Mono<DatasourceStructure> getStructure(
                Void connection, DatasourceConfiguration datasourceConfiguration) {

            return fetchAccessToken(datasourceConfiguration)
                    .flatMap(tokenResponse -> {
                        WebClient client = WebClientUtils.builder()
                                .exchangeStrategies(EXCHANGE_STRATEGIES)
                                .build();

                        return client
                                .get()
                                .uri(URI.create(tokenResponse.basePath() + "/metadata/"))
                                .header("Authorization", "Token " + tokenResponse.accessToken())
                                .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                                .retrieve()
                                .bodyToMono(byte[].class)
                                .timeout(REQUEST_TIMEOUT);
                    })
                    .map(responseBytes -> {
                        DatasourceStructure structure = new DatasourceStructure();
                        List<DatasourceStructure.Table> tables = new ArrayList<>();
                        structure.setTables(tables);

                        try {
                            JsonNode json = objectMapper.readTree(responseBytes);
                            JsonNode metadata = json.get("metadata");
                            if (metadata == null) {
                                return structure;
                            }
                            JsonNode tablesNode = metadata.get("tables");
                            if (tablesNode == null || !tablesNode.isArray()) {
                                return structure;
                            }

                            for (JsonNode tableNode : tablesNode) {
                                if (!tableNode.hasNonNull("name")) {
                                    log.warn("Skipping table entry with missing name");
                                    continue;
                                }
                                String tableName = tableNode.get("name").asText();
                                List<DatasourceStructure.Column> columns = new ArrayList<>();

                                JsonNode columnsNode = tableNode.get("columns");
                                if (columnsNode != null && columnsNode.isArray()) {
                                    for (JsonNode colNode : columnsNode) {
                                        if (!colNode.hasNonNull("name") || !colNode.hasNonNull("type")) {
                                            log.warn("Skipping column entry with missing name or type in table: {}",
                                                    tableName);
                                            continue;
                                        }
                                        String colName = colNode.get("name").asText();
                                        String colType = colNode.get("type").asText();
                                        columns.add(new DatasourceStructure.Column(
                                                colName, colType, null, false));
                                    }
                                }

                                tables.add(new DatasourceStructure.Table(
                                        DatasourceStructure.TableType.TABLE,
                                        null,
                                        tableName,
                                        columns,
                                        new ArrayList<>(),
                                        new ArrayList<>()));
                            }
                        } catch (IOException e) {
                            log.error("Failed to parse SeaTable metadata", e);
                        }

                        return structure;
                    })
                    .subscribeOn(scheduler);
        }
    }
}
