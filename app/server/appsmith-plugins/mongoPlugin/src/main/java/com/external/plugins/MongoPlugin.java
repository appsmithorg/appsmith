package com.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.constants.DisplayDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.constants.MongoSpecialDataTypes;
import com.external.plugins.utils.MongoErrorUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.ConnectionString;
import com.mongodb.DBRefCodecProvider;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoSocketWriteException;
import com.mongodb.MongoTimeoutException;
import com.mongodb.client.gridfs.codecs.GridFSFileCodecProvider;
import com.mongodb.client.model.geojson.codecs.GeoJsonCodecProvider;
import com.mongodb.connection.ConnectionPoolSettings;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.BsonValueCodecProvider;
import org.bson.codecs.DocumentCodec;
import org.bson.codecs.DocumentCodecProvider;
import org.bson.codecs.IterableCodecProvider;
import org.bson.codecs.MapCodecProvider;
import org.bson.codecs.ValueCodecProvider;
import org.bson.codecs.configuration.CodecRegistries;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.conversions.Bson;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.reactivestreams.Publisher;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.OBJECT_TYPE;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COUNT_QUERY;
import static com.external.plugins.constants.FieldName.DELETE_QUERY;
import static com.external.plugins.constants.FieldName.DISTINCT_QUERY;
import static com.external.plugins.constants.FieldName.FIND_PROJECTION;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.FIND_SORT;
import static com.external.plugins.constants.FieldName.INSERT_DOCUMENT;
import static com.external.plugins.constants.FieldName.NATIVE_QUERY_PATH_DATA;
import static com.external.plugins.constants.FieldName.NATIVE_QUERY_PATH_STATUS;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.SUCCESS;
import static com.external.plugins.constants.FieldName.UPDATE_OPERATION;
import static com.external.plugins.constants.FieldName.UPDATE_QUERY;
import static com.external.plugins.utils.DatasourceUtils.buildClientURI;
import static com.external.plugins.utils.DatasourceUtils.buildURIFromExtractedInfo;
import static com.external.plugins.utils.DatasourceUtils.extractInfoFromConnectionStringURI;
import static com.external.plugins.utils.DatasourceUtils.hasNonEmptyURI;
import static com.external.plugins.utils.DatasourceUtils.isAuthenticated;
import static com.external.plugins.utils.DatasourceUtils.isHostStringConnectionURI;
import static com.external.plugins.utils.DatasourceUtils.isUsingURI;
import static com.external.plugins.utils.MongoPluginUtils.convertMongoFormInputToRawCommand;
import static com.external.plugins.utils.MongoPluginUtils.generateTemplatesAndStructureForACollection;
import static com.external.plugins.utils.MongoPluginUtils.getDatabaseName;
import static com.external.plugins.utils.MongoPluginUtils.getRawQuery;
import static com.external.plugins.utils.MongoPluginUtils.isRawCommand;
import static java.lang.Boolean.TRUE;
import static java.util.Arrays.asList;
import static org.apache.logging.log4j.util.Strings.isBlank;

public class MongoPlugin extends BasePlugin {

    private static final Set<DBAuth.Type> VALID_AUTH_TYPES = Set.of(
            DBAuth.Type.SCRAM_SHA_1,
            DBAuth.Type.SCRAM_SHA_256,
            DBAuth.Type.MONGODB_CR  // NOTE: Deprecated in the driver.
    );

    private static final String VALID_AUTH_TYPES_STR = VALID_AUTH_TYPES.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(", "));

    public static final String N_MODIFIED = "nModified";

    private static final String VALUE = "value";

    private static final String VALUES = "values";

    private static final int TEST_DATASOURCE_TIMEOUT_SECONDS = 15;

    /*
     * - The regex matches the following two pattern types:
     *   - mongodb+srv://user:pass@some-url/some-db...
     *   - mongodb://user:pass@some-url:port,some-url:port,.../some-db...
     * - It has been grouped like this: (mongodb+srv://)(user):(pass)@(some-url)/(some-db...)?(params...)
     */
    private static final String MONGO_URI_REGEX = "^(mongodb(?:\\+srv)?://)(?:(.+):(.+)@)?([^/?]+)/?([^?]+)?\\??(.+)?$";

    /**
     * We use this regex to find usage of special Mongo data types like ObjectId(...) wrapped inside double quotes
     * e.g. "ObjectId(...)". Case for single quotes e.g. 'ObjectId(...)' is not added because the way client sends
     * back the data to the API server it would be extremely uncommon to encounter this case.
     *
     * In the given regex E is replaced by the name of special data types before doing the match / find operation.
     * e.g. E will be replaced with ObjectId to find the occurrence of "ObjectId(...)" pattern.
     *
     * Example: for "[\"ObjectId('xyz')\"]":
     *   o group 1 will match "ObjectId(...)"
     *   o group 2 will match ObjectId(...)
     *   o group 3 will match 'xyz'
     *   o group 4 will match xyz
     */
    private static final String MONGODB_SPECIAL_TYPE_INSIDE_QUOTES_REGEX_TEMPLATE = "(\\\"(E\\((.*?((\\w|-|:|\\.|,|\\s)+).*?)?\\))\\\")";

    private static final String KEY_USERNAME = "username";

    private static final String KEY_PASSWORD = "password";

    private static final String KEY_URI_DBNAME = "dbName";

    private static final int DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX = 1;

    private static final Integer MONGO_COMMAND_EXCEPTION_UNAUTHORIZED_ERROR_CODE = 13;

    private static final Set<String> bsonFields = new HashSet<>(asList(
            AGGREGATE_PIPELINES,
            COUNT_QUERY,
            DELETE_QUERY,
            DISTINCT_QUERY,
            FIND_QUERY,
            FIND_SORT,
            FIND_PROJECTION,
            INSERT_DOCUMENT,
            UPDATE_QUERY,
            UPDATE_OPERATION
    ));

    private static final MongoErrorUtils mongoErrorUtils = MongoErrorUtils.getInstance();

    private static final CodecRegistry DEFAULT_REGISTRY = CodecRegistries.fromProviders(Arrays.asList(
            new ValueCodecProvider(),
            new IterableCodecProvider(),
            new BsonValueCodecProvider(),
            new DocumentCodecProvider(),
            new MapCodecProvider(),
            new DBRefCodecProvider(),
            new GeoJsonCodecProvider(),
            new GridFSFileCodecProvider()
    ));

    private static final BsonTypeClassMap DEFAULT_BSON_TYPE_CLASS_MAP = new org.bson.codecs.BsonTypeClassMap();

    public MongoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class MongoPluginExecutor implements PluginExecutor<MongoClient>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.elastic();

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * also update the datasource and action configuration for pagination and some minor cleanup of the configuration before execution
         *
         * @param mongoClient             : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(MongoClient mongoClient,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {


            final Map<String, Object> formData = actionConfiguration.getFormData();
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            Boolean smartBsonSubstitution = TRUE;

            Object smartSubstitutionObject = PluginUtils.getDataValueSafelyFromFormData(formData, SMART_SUBSTITUTION, OBJECT_TYPE, TRUE);
            if (smartSubstitutionObject instanceof Boolean) {
                smartBsonSubstitution = (Boolean) smartSubstitutionObject;
            } else if (smartSubstitutionObject instanceof String) {
                // Older UI configuration used to set this value as a string which may/may not be castable to a boolean
                // directly. This is to ensure we are backward compatible
                smartBsonSubstitution = Boolean.parseBoolean((String) smartSubstitutionObject);
            }

            // Smartly substitute in formData.body and replace all the bindings with values.
            if (TRUE.equals(smartBsonSubstitution)) {

                // If not raw, then it must be form input.
                if (!isRawCommand(formData)) {
                    smartSubstituteFormCommand(formData,
                            executeActionDTO.getParams(), parameters);
                } else {
                    // For raw queries do smart replacements in BSON body
                    final Object body = PluginUtils.getDataValueSafelyFromFormData(formData, BODY, OBJECT_TYPE);
                    if (body != null) {
                        try {
                            String updatedRawQuery = smartSubstituteBSON((String) body,
                                    executeActionDTO.getParams(), parameters);
                            setDataValueSafelyInFormData(formData, BODY, updatedRawQuery);
                        } catch (AppsmithPluginException e) {
                            ActionExecutionResult errorResult = new ActionExecutionResult();
                            errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                            errorResult.setIsExecutionSuccess(false);
                            errorResult.setBody(e.getMessage());
                            return Mono.just(errorResult);
                        }
                    }
                }
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            // In case the input type is form instead of raw, parse the same into BSON command
            String parsedRawCommand = convertMongoFormInputToRawCommand(actionConfiguration);
            if (parsedRawCommand != null) {
                setDataValueSafelyInFormData(formData, BODY, parsedRawCommand);
            }

            actionConfiguration.setFormData(formData);

            return this.executeCommon(mongoClient, datasourceConfiguration, actionConfiguration, parameters);
        }

        /**
         * For reference on creating the json queries for Mongo please head to
         * https://docs.huihoo.com/mongodb/3.4/reference/command/index.html
         *
         * @param mongoClient             : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return Result data from executing the action's query.
         */
        public Mono<ActionExecutionResult> executeCommon(MongoClient mongoClient,
                                                         DatasourceConfiguration datasourceConfiguration,
                                                         ActionConfiguration actionConfiguration,
                                                         List<Map.Entry<String, String>> parameters) {

            if (mongoClient == null) {
                log.info("Encountered null connection in MongoDB plugin. Reporting back.");
                throw new StaleConnectionException();
            }

            MongoDatabase database = mongoClient.getDatabase(getDatabaseName(datasourceConfiguration));

            final Map<String, Object> formData = actionConfiguration.getFormData();

            String query = PluginUtils.getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE);
            Bson command = Document.parse(query);

            Mono<Document> mongoOutputMono = Mono.from(database.runCommand(command));
            ActionExecutionResult result = new ActionExecutionResult();
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null
                    , null, null));

            return mongoOutputMono
                    .onErrorMap(
                            MongoTimeoutException.class,
                            error -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR,
                                    error.getMessage()
                            )
                    )
                    .onErrorMap(
                            MongoCommandException.class,
                            error -> new AppsmithPluginException(
                                    error,
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    error.getErrorMessage()
                            )
                    )
                    // This is an experimental fix to handle the scenario where after a period of inactivity, the mongo
                    // database drops the connection which makes the client throw the following exception.
                    .onErrorMap(
                            MongoSocketWriteException.class,
                            error -> new StaleConnectionException()
                    )
                    .flatMap(mongoOutput -> {
                        try {
                            /*
                             * Added Custom codec for JSON conversion since MongoDB Reactive API does not support
                             * processing of DbRef Object.
                             * https://github.com/spring-projects/spring-data-mongodb/issues/3015 : Mark Paluch commented
                             */
                            DocumentCodec documentCodec = new DocumentCodec(
                                    DEFAULT_REGISTRY,
                                    DEFAULT_BSON_TYPE_CLASS_MAP
                            );

                            JSONObject outputJson = new JSONObject(mongoOutput.toJson(documentCodec));

                            //The output json contains the key "ok". This is the status of the command
                            BigInteger status = outputJson.getBigInteger("ok");
                            JSONArray headerArray = new JSONArray();

                            if (BigInteger.ONE.equals(status)) {
                                result.setIsExecutionSuccess(true);
                                result.setDataTypes(List.of(
                                        new ParsedDataType(DisplayDataType.JSON),
                                        new ParsedDataType(DisplayDataType.RAW)
                                ));

                                /*
                                  For the `findAndModify` command, we don't get the count of modifications made. Instead,
                                  we either get the modified new value or the pre-modified old value (depending on the
                                  `new` field in the command. Let's return that value to the user.
                                 */
                                if (outputJson.has(VALUE)) {
                                    result.setBody(objectMapper.readTree(
                                            cleanUp(new JSONObject().put(VALUE, outputJson.get(VALUE))).toString()
                                    ));
                                }

                                /*
                                  The json contains key "cursor" when find command was issued and there are 1 or more
                                  results. In case there are no results for find, this key is not present in the result json.
                                 */
                                if (outputJson.has("cursor")) {
                                    JSONArray outputResult = (JSONArray) cleanUp(
                                            outputJson.getJSONObject("cursor").getJSONArray("firstBatch"));
                                    result.setBody(objectMapper.readTree(outputResult.toString()));
                                }

                                /*
                                  The json contains key "n" when insert/update command is issued. "n" for update
                                  signifies the no of documents selected for update. "n" in case of insert signifies the
                                  number of documents inserted.
                                 */
                                if (outputJson.has("n")) {
                                    JSONObject body = new JSONObject().put("n", outputJson.getBigInteger("n"));
                                    result.setBody(objectMapper.readTree(body.toString()));
                                    headerArray.put(body);
                                }

                                /*
                                  The json key contains key "nModified" in case of update command. This signifies the no of
                                  documents updated.
                                 */
                                if (outputJson.has(N_MODIFIED)) {
                                    JSONObject body = new JSONObject().put(N_MODIFIED, outputJson.getBigInteger(N_MODIFIED));
                                    result.setBody(objectMapper.readTree(body.toString()));
                                    headerArray.put(body);
                                }

                                /*
                                  The json contains key "values" when distinct command is used.
                                 */
                                if (outputJson.has(VALUES)) {
                                    JSONArray outputResult = (JSONArray) cleanUp(
                                            outputJson.getJSONArray(VALUES));

                                    ObjectNode resultNode = objectMapper.createObjectNode();

                                    // Create a JSON structure with the results stored with a key to abide by the
                                    // Server-Client contract of only sending array of objects in result.
                                    resultNode
                                            .putArray(VALUES)
                                            .addAll((ArrayNode) objectMapper.readTree(outputResult.toString()));

                                    result.setBody(objectMapper.readTree(resultNode.toString()));
                                }

                                /*
                                TODO Go through all the possible fields that are returned in the output JSON and add all the fields
                                 that are important to the headerArray.
                                 */
                            }

                            JSONObject statusJson = new JSONObject().put("ok", status);
                            headerArray.put(statusJson);
                            result.setHeaders(objectMapper.readTree(headerArray.toString()));
                        } catch (Exception e) {
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                        }

                        return Mono.just(result);
                    })
                    .onErrorResume(error -> {
                        if (error instanceof StaleConnectionException) {
                            log.debug("The mongo connection seems to have been invalidated or doesn't exist anymore");
                            return Mono.error(error);
                        }
                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setIsExecutionSuccess(false);
                        actionExecutionResult.setErrorInfo(error, mongoErrorUtils);
                        return Mono.just(actionExecutionResult);
                    })
                    // Now set the request in the result to be returned back to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        if (!parameters.isEmpty()) {
                            final Map<String, Object> requestData = new HashMap<>();
                            requestData.put("smart-substitution-parameters", parameters);
                            request.setProperties(requestData);
                        }
                        request.setRequestParams(requestParams);
                        actionExecutionResult.setRequest(request);
                        return actionExecutionResult;
                    })
                    .subscribeOn(scheduler);
        }

        /**
         * This method is part of the pre-processing of the replacement value before the final substitution that
         * happens as part of smart substitution process.
         *
         * @param replacementValue - value to be substituted
         * @param dataType         - the expected datatype of the value
         * @return - updated replacement value
         */
        @Override
        public String sanitizeReplacement(String replacementValue, DataType dataType) {
            replacementValue = removeOrAddQuotesAroundMongoDBSpecialTypes(replacementValue);

            if (DataType.BSON_SPECIAL_DATA_TYPES.equals(dataType)) {
                /*
                  For all other data types the replacementValue is prepared for replacement (by using Matcher
                  .quoteReplacement(...)) during the common handling of data types in
                  `jsonSmartReplacementPlaceholderWithValue(...)` method before reaching this program point. For
                  BSON_SPECIAL_DATA_TYPES it is skipped in the common handling flow because we want to modify
                  (removeOrAddQuotesAroundMongoDBSpecialTypes(...)) the replacement value further before the final
                  replacement happens.
                 */
                replacementValue = Matcher.quoteReplacement(replacementValue);
            }

            return replacementValue;
        }

        /**
         * This method is meant to remove extra quotes around the MongoDB special types like `ObjectId(...)` string.
         * E.g. if the input query is "... {$in: [\"ObjectId(\"123\")\"]}" then the output query will be "... {$in:
         * [ObjectId(\"123\")]}".
         * Please note that it may also add quotes around the data type arguments if required. e.g. "ObjectId(xyz)"
         * -> "ObjectId(\"xyz\")"
         *
         * @param query - input query
         * @return - query obtained after removing/adding quotes around MongoDB special types string.
         */
        private String removeOrAddQuotesAroundMongoDBSpecialTypes(String query) {
            // Iterating over MongoDB types and creating a regex for every one of them
            for (MongoSpecialDataTypes specialType : MongoSpecialDataTypes.values()) {
                final String regex = MONGODB_SPECIAL_TYPE_INSIDE_QUOTES_REGEX_TEMPLATE.replace("E", specialType.name());

                Map<String, String> objectIdMap = new LinkedHashMap<>();

                Pattern pattern = Pattern.compile(regex);
                Matcher matcher = pattern.matcher(query);
                while (matcher.find()) {
                    /*
                      `If` branch will match when any special data type is found wrapped within double quotes e.g.
                      "ObjectId('someId')":
                        o Group 1 = "ObjectId('someId')"
                        o Group 2 = ObjectId(someId)
                        o Group 3 = 'someId'
                        o Group 4 = someId
                     */
                    if (matcher.group(1) != null) {
                        String objectIdWithQuotes = matcher.group(1);
                        String objectIdWithoutQuotes = matcher.group(2);
                        String argWithQuotes = matcher.group(3);
                        String argWithoutQuotes = "";
                        try {
                            argWithoutQuotes = matcher.group(4);
                            if (specialType.isQuotesRequiredAroundParameter()) {
                                argWithoutQuotes = objectMapper.writeValueAsString(argWithoutQuotes);
                            }
                        } catch (JsonProcessingException e) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                    argWithoutQuotes,
                                    e.getMessage()
                            );
                        }
                        objectIdMap.put(objectIdWithQuotes, objectIdWithoutQuotes);
                        objectIdMap.put(argWithQuotes, argWithoutQuotes);
                    }
                }

                for (Map.Entry<String, String> entry : objectIdMap.entrySet()) {
                    String objectIdWithQuotes = (entry).getKey();
                    String objectIdWithoutQuotes = (entry).getValue();
                    query = query.replace(objectIdWithQuotes, objectIdWithoutQuotes);
                }
            }
            return query;
        }

        private String smartSubstituteBSON(String rawQuery,
                                           List<Param> params,
                                           List<Map.Entry<String, String>> parameters) throws AppsmithPluginException {

            // First extract all the bindings in order
            List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(rawQuery);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithPlaceholder(rawQuery, mustacheKeysInOrder);

            updatedQuery = (String) smartSubstitutionOfBindings(updatedQuery,
                    mustacheKeysInOrder,
                    params,
                    parameters);

            return updatedQuery;
        }

        /**
         * !!!WARNING!!! : formData gets updated as part of this flow (and hence is not being returned)
         * This function replaces the mustache variables using smart substitution and updates the existing formData
         * with the values post substitution
         */
        private void smartSubstituteFormCommand(Map<String, Object> formData,
                                                List<Param> params,
                                                List<Map.Entry<String, String>> parameters) throws AppsmithPluginException {

            for (String bsonField : bsonFields) {
                if (validConfigurationPresentInFormData(formData, bsonField)) {
                    String preSmartSubValue = PluginUtils.getDataValueSafelyFromFormData(formData, bsonField, STRING_TYPE);
                    String postSmartSubValue = smartSubstituteBSON(preSmartSubValue, params, parameters);
                    setDataValueSafelyInFormData(formData, bsonField, postSmartSubValue);
                }
            }
        }

        @Override
        public Mono<MongoClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            /*
              TODO: ReadOnly seems to be not supported at the driver level. The recommendation is to connect with
               a user that doesn't have write permissions on the database.
               Ref: https://api.mongodb.com/java/2.13/com/mongodb/DB.html#setReadOnly-java.lang.Boolean-
             */

            return Mono.just(datasourceConfiguration)
                    .flatMap(dsConfig -> {
                        try {
                            return Mono.just(buildClientURI(dsConfig));
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }
                    })
                    .map(uriString -> MongoClients.create(
                            MongoClientSettings
                                    .builder()
                                    .applyToConnectionPoolSettings(t -> t.applySettings(ConnectionPoolSettings.builder().minSize(0).build()))
                                    .applyConnectionString(new ConnectionString(uriString))
                                    .build()
                    ))
                    .onErrorMap(
                            IllegalArgumentException.class,
                            error ->
                                    new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                            error.getMessage()
                                    )
                    )
                    .onErrorMap(e -> {
                        if (!(e instanceof AppsmithPluginException)) {
                            return new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage());
                        }

                        return e;
                    })
                    .subscribeOn(scheduler);
        }



        @Override
        public void datasourceDestroy(MongoClient mongoClient) {
            if (mongoClient != null) {
                mongoClient.close();
            }
        }


        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();
            List<Property> properties = datasourceConfiguration.getProperties();
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isUsingURI(datasourceConfiguration)) {
                if (!hasNonEmptyURI(datasourceConfiguration)) {
                    invalids.add("'Mongo Connection String URI' field is empty. Please edit the 'Mongo Connection " +
                            "URI' field to provide a connection uri to connect with.");
                } else {
                    String mongoUri = (String) properties.get(DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX).getValue();
                    if (!mongoUri.matches(MONGO_URI_REGEX)) {
                        invalids.add("Mongo Connection String URI does not seem to be in the correct format. Please " +
                                "check the URI once.");
                    } else {
                        Map extractedInfo = extractInfoFromConnectionStringURI(mongoUri, MONGO_URI_REGEX);
                        if (extractedInfo == null) {
                            invalids.add("Mongo Connection String URI does not seem to be in the correct format. " +
                                    "Please check the URI once.");
                        } else if (!isAuthenticated(authentication, mongoUri)) {
                            String mongoUriWithHiddenPassword = buildURIFromExtractedInfo(extractedInfo, "****");
                            properties.get(DATASOURCE_CONFIG_MONGO_URI_PROPERTY_INDEX).setValue(mongoUriWithHiddenPassword);
                            authentication = (authentication == null) ? new DBAuth() : authentication;
                            authentication.setUsername((String) extractedInfo.get(KEY_USERNAME));
                            authentication.setPassword((String) extractedInfo.get(KEY_PASSWORD));
                            authentication.setDatabaseName((String) extractedInfo.get(KEY_URI_DBNAME));
                            datasourceConfiguration.setAuthentication(authentication);

                            // remove any default db set via form auto-fill via browser
                            if (datasourceConfiguration.getConnection() != null) {
                                datasourceConfiguration.getConnection().setDefaultDatabaseName(null);
                            }
                        }
                    }
                }
            } else {
                List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
                if (CollectionUtils.isEmpty(endpoints)) {
                    invalids.add("Missing endpoint(s).");

                } else if (Connection.Type.REPLICA_SET.equals(datasourceConfiguration.getConnection().getType())) {
                    if (endpoints.size() == 1 && endpoints.get(0).getPort() != null) {
                        invalids.add("REPLICA_SET connections should not be given a port." +
                                " If you are trying to specify all the shards, please add more than one.");
                    }

                }

                if (!CollectionUtils.isEmpty(endpoints)) {
                    boolean usingUri = endpoints
                            .stream()
                            .anyMatch(endPoint -> isHostStringConnectionURI(endPoint));

                    if (usingUri) {
                        invalids.add("It seems that you are trying to use a mongo connection string URI. Please " +
                                "extract relevant fields and fill the form with extracted values. For " +
                                "details, please check out the Appsmith's documentation for Mongo database. " +
                                "Alternatively, you may use 'Import from Connection String URI' option from the " +
                                "dropdown labelled 'Use Mongo Connection String URI' to use the URI connection string" +
                                " directly.");
                    }
                }

                if (authentication != null) {
                    DBAuth.Type authType = authentication.getAuthType();

                    if (authType == null || !VALID_AUTH_TYPES.contains(authType)) {
                        invalids.add("Invalid authType. Must be one of " + VALID_AUTH_TYPES_STR);
                    }

                    if (!StringUtils.hasLength(authentication.getDatabaseName())) {
                        invalids.add("Missing database name.");
                    }

                }

                /*
                 * Ideally, it is never expected to be null because the SSL dropdown is set to an initial value.
                 */
                if (datasourceConfiguration.getConnection() == null
                        || datasourceConfiguration.getConnection().getSsl() == null
                        || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
                    invalids.add("Appsmith server has failed to fetch SSL configuration from datasource configuration " +
                            "form. Please reach out to Appsmith customer support to resolve this.");
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {

            Function<TimeoutException, Throwable> timeoutExceptionThrowableFunction = error -> new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_TIMEOUT_ERROR,
                    "Connection timed out. Please check if the datasource configuration fields have " +
                            "been filled correctly."
            );

            final String defaultDatabaseName;
            if (datasourceConfiguration.getConnection() != null) {
                defaultDatabaseName = datasourceConfiguration.getConnection().getDefaultDatabaseName();
            } else defaultDatabaseName = null;

            return datasourceCreate(datasourceConfiguration)
                    .flatMap(mongoClient -> {
                        final Publisher<String> result = mongoClient.listDatabaseNames();
                        final Mono<List<String>> documentMono = Flux.from(result).collectList().cache();
                        return documentMono.doFinally(ignored -> mongoClient.close()).then(documentMono);
                    })
                    .flatMap(names -> {
                        if (defaultDatabaseName == null || defaultDatabaseName.isBlank()) {
                            return Mono.just(new DatasourceTestResult());
                        }
                        final Optional<String> defaultDB = names.stream()
                                .filter(name -> name.equals(defaultDatabaseName))
                                .findFirst();

                        if (defaultDB.isEmpty()) {
                            // value entered in default database name is invalid
                            return Mono.just(new DatasourceTestResult("Default Database Name is invalid, no database found with this name."));
                        }
                        return Mono.just(new DatasourceTestResult());
                    })
                    .timeout(Duration.ofSeconds(TEST_DATASOURCE_TIMEOUT_SECONDS))
                    .onErrorMap(TimeoutException.class, timeoutExceptionThrowableFunction)
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(mongoErrorUtils.getReadableError(error))))
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(MongoClient mongoClient, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            List<DatasourceStructure.Table> tables = new ArrayList<>();
            structure.setTables(tables);

            final MongoDatabase database = mongoClient.getDatabase(getDatabaseName(datasourceConfiguration));

            return Flux.from(database.listCollectionNames())
                    .flatMap(collectionName -> {
                        final ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
                        final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                        tables.add(new DatasourceStructure.Table(
                                DatasourceStructure.TableType.COLLECTION,
                                null,
                                collectionName,
                                columns,
                                new ArrayList<>(),
                                templates
                        ));

                        return Mono.zip(
                                Mono.just(columns),
                                Mono.just(templates),
                                Mono.just(collectionName),
                                Mono.from(database.getCollection(collectionName).find().limit(1).first())
                        );
                    })
                    .flatMap(tuple -> {
                        final ArrayList<DatasourceStructure.Column> columns = tuple.getT1();
                        final ArrayList<DatasourceStructure.Template> templates = tuple.getT2();
                        String collectionName = tuple.getT3();
                        Document document = tuple.getT4();

                        generateTemplatesAndStructureForACollection(collectionName, document, columns, templates);

                        return Mono.just(structure);
                    })
                    .collectList()
                    .thenReturn(structure)
                    .onErrorMap(
                            MongoCommandException.class,
                            error -> {
                                if (MONGO_COMMAND_EXCEPTION_UNAUTHORIZED_ERROR_CODE.equals(error.getErrorCode())) {
                                    return new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                            "Appsmith has failed to get database structure. Please provide read permission on" +
                                                    " the database to fix this."
                                    );
                                }

                                return error;
                            }
                    )
                    .subscribeOn(scheduler);
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {
            String jsonBody = (String) input;
            DataType dataType = stringToKnownMongoDBDataTypeConverter(value);
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(jsonBody, value,dataType, insertedParams, this);
        }

        /**
         * This method checks if the replacement string contains any usage of special Mongo data types like
         * `ObjectId` or `ISODate`. For complete list please check out `MongoSpecialDataTypes.java`. The check for
         * special data type only happens if the common data type detection login in `DataTypeStringUtils
         * .stringToKnownDataTypeConverter` identifies the data type of the replacement value as `DataType.STRING`
         * even though it contains a Mongo special data type and hence should be treated differently.
         *
         * @param replacement replacement value
         * @return identified data type of replacement value
         */
        private DataType stringToKnownMongoDBDataTypeConverter(String replacement) {
            DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(replacement);
            if (dataType == DataType.STRING) {
                for (MongoSpecialDataTypes specialType : MongoSpecialDataTypes.values()) {
                    final String regex = MONGODB_SPECIAL_TYPE_INSIDE_QUOTES_REGEX_TEMPLATE.replace("E",
                            specialType.name());
                    final Pattern pattern = Pattern.compile(regex);
                    final Matcher matcher = pattern.matcher(replacement);
                    if (matcher.find()) {
                        dataType = DataType.BSON_SPECIAL_DATA_TYPES;
                        break;
                    }
                }
            }

            return dataType;
        }


        @Override
        public Mono<ActionExecutionResult> execute(MongoClient mongoClient,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        /**
         * This method coverts Mongo plugin's form data to Mongo's native query. Currently, it is meant to help users
         * switch easily from form based input to raw input mode by providing a readily available translation of the
         * form data to raw query.
         * @return Mongo's native/raw query set at path `formData.formToNativeQuery.data`
         */
        @Override
        public void extractAndSetNativeQueryFromFormData(ActionConfiguration actionConfiguration) {
            Map<String, Object> formData = actionConfiguration.getFormData();
            if (formData != null && !formData.isEmpty()) {
                /* If it is not raw command, then it must be one of the mongo form commands */
                if (!isRawCommand(formData)) {

                    /*
                      This translation must happen only if the user has not edited the raw mode. Hence, check that
                      user has not provided any raw query.
                     */
                    if (isBlank(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE))) {
                        try {
                            String rawQuery = getRawQuery(actionConfiguration);
                            if (rawQuery != null) {
                                setValueSafelyInFormData(formData, NATIVE_QUERY_PATH_STATUS, SUCCESS);
                                setValueSafelyInFormData(formData, NATIVE_QUERY_PATH_DATA, rawQuery);
                            }
                        } catch (Exception e) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_FORM_TO_NATIVE_TRANSLATION_ERROR,
                                    e.getMessage()
                            );
                        }
                    }
                }
            }
        }
    }

    private static Object cleanUp(Object object) {
        if (object instanceof JSONObject) {
            JSONObject jsonObject = (JSONObject) object;
            final boolean isSingleKey = jsonObject.keySet().size() == 1;

            if (isSingleKey && "$numberLong".equals(jsonObject.keys().next())) {
                return jsonObject.getBigInteger("$numberLong");

            } else if (isSingleKey && "$oid".equals(jsonObject.keys().next())) {
                return jsonObject.getString("$oid");

            } else if (isSingleKey && "$date".equals(jsonObject.keys().next())) {
                JSONObject dateJSON = jsonObject.optJSONObject("$date");
                /*
                    For dates before Jan 1, 1970 then the output json from MongoDB driver looks like
                    "$date": {
                        "$numberLong": "-493033770000"
                    }
                    And for dates on or after Jan 1, 1970 the output json from MongoDB driver is readily available and looks like
                    "$date": "2022-07-01T10:32:37.318Z"
                */
                if (dateJSON != null && dateJSON.keySet().size() == 1 &&
                        "$numberLong".equals(dateJSON.keys().next())) {
                    return DateTimeFormatter.ISO_INSTANT.format(
                            Instant.ofEpochMilli(dateJSON.getLong("$numberLong")));
                }
                return DateTimeFormatter.ISO_INSTANT.format(
                        Instant.parse(jsonObject.getString("$date"))
                );

            } else if (isSingleKey && "$numberDecimal".equals(jsonObject.keys().next())) {
                return new BigDecimal(jsonObject.getString("$numberDecimal"));

            } else {
                for (String key : new HashSet<>(jsonObject.keySet())) {
                    jsonObject.put(key, cleanUp(jsonObject.get(key)));
                }

            }

        } else if (object instanceof JSONArray) {
            Collection<Object> cleaned = new ArrayList<>();

            for (Object child : (JSONArray) object) {
                cleaned.add(cleanUp(child));
            }

            return new JSONArray(cleaned);

        }

        return object;
    }

}
