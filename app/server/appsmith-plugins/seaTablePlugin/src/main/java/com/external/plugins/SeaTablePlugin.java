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
 * SeaTable API flow:
 * 1. Exchange API-Token for a Base-Token (access_token) via GET /api/v2.1/dtable/app-access-token/
 *    Response includes: access_token, dtable_uuid, dtable_server
 * 2. All row/metadata/sql operations use the dtable_server URL:
 *    {dtable_server}/api/v2/dtables/{dtable_uuid}/...
 *    with header: Authorization: Token {access_token}
 *
 * API reference: https://api.seatable.com/
 */
public class SeaTablePlugin extends BasePlugin {

    private static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

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
                        updatedBody = (String) smartSubstitutionOfBindings(
                                updatedBody,
                                mustacheKeysInOrder,
                                executeActionDTO.getParams(),
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
         * Exchange the API-Token for a Base-Token (access token).
         * GET {serverUrl}/api/v2.1/dtable/app-access-token/
         * Header: Authorization: Token {apiToken}
         *
         * Response:
         * {
         *   "app_name": "...",
         *   "access_token": "eyJ...",
         *   "dtable_uuid": "650d8a0d-...",
         *   "dtable_server": "https://cloud.seatable.io/api-gateway/",
         *   ...
         * }
         *
         * The dtable_server URL already includes /api-gateway/.
         * All subsequent calls go to: {dtable_server}api/v2/dtables/{dtable_uuid}/...
         */
        private Mono<AccessTokenResponse> fetchAccessToken(DatasourceConfiguration datasourceConfiguration) {
            String serverUrl = datasourceConfiguration.getUrl().trim();
            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
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
                    .map(responseBytes -> {
                        try {
                            JsonNode json = objectMapper.readTree(responseBytes);
                            String accessToken = json.get("access_token").asText();
                            String dtableUuid = json.get("dtable_uuid").asText();
                            String dtableServer = json.get("dtable_server").asText();

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

        private WebClient.RequestHeadersSpec<?> buildRequest(
                String basePath, String accessToken, HttpMethod method, String path) {
            return buildRequest(basePath, accessToken, method, path, null);
        }

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

        private Mono<ActionExecutionResult> executeRequest(WebClient.RequestHeadersSpec<?> requestSpec) {
            return requestSpec
                    .retrieve()
                    .bodyToMono(byte[].class)
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

        // --- Command implementations ---

        /**
         * GET /api/v2/dtables/{base_uuid}/rows/?table_name=X&start=0&limit=100&order_by=col&direction=asc&convert_keys=true
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
         * GET /api/v2/dtables/{base_uuid}/rows/{row_id}/?table_name=X&convert_keys=true
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
         * GET /api/v2/dtables/{base_uuid}/metadata/
         */
        private Mono<ActionExecutionResult> executeListTables(String basePath, String accessToken) {
            return executeRequest(
                    buildRequest(basePath, accessToken, HttpMethod.GET, "/metadata/"));
        }

        /**
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

        @Override
        public Mono<Void> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty().then();
        }

        @Override
        public void datasourceDestroy(Void connection) {
            // Nothing to destroy for stateless HTTP
        }

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
                                .bodyToMono(byte[].class);
                    })
                    .map(responseBytes -> {
                        DatasourceStructure structure = new DatasourceStructure();
                        List<DatasourceStructure.Table> tables = new ArrayList<>();

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
                                String tableName = tableNode.get("name").asText();
                                List<DatasourceStructure.Column> columns = new ArrayList<>();

                                JsonNode columnsNode = tableNode.get("columns");
                                if (columnsNode != null && columnsNode.isArray()) {
                                    for (JsonNode colNode : columnsNode) {
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

                        structure.setTables(tables);
                        return structure;
                    })
                    .subscribeOn(scheduler);
        }
    }
}
