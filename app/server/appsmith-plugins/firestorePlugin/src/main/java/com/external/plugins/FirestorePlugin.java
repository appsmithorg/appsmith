package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.exceptions.FirestoreErrorMessages;
import com.external.plugins.exceptions.FirestorePluginError;
import com.fasterxml.jackson.core.type.TypeReference;
import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreException;
import com.google.cloud.firestore.GeoPoint;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.constants.FieldName.BODY;
import static com.external.constants.FieldName.COMMAND;
import static com.external.constants.FieldName.DELETE_KEY_PATH;
import static com.external.constants.FieldName.END_BEFORE;
import static com.external.constants.FieldName.LIMIT_DOCUMENTS;
import static com.external.constants.FieldName.NEXT;
import static com.external.constants.FieldName.ORDER_BY;
import static com.external.constants.FieldName.PATH;
import static com.external.constants.FieldName.PREV;
import static com.external.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.constants.FieldName.START_AFTER;
import static com.external.constants.FieldName.TIMESTAMP_VALUE_PATH;
import static com.external.constants.FieldName.WHERE;
import static com.external.utils.WhereConditionUtils.applyWhereConditional;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang3.StringUtils.isBlank;

/**
 * Datasource properties:
 * 1. Client JSON
 * <p>
 * Query Action properties:
 * 1. method: Dropdown
 * 2. collection: String
 * 3. documentKey: String
 */
public class FirestorePlugin extends BasePlugin {

    private static final String FIELDVALUE_TIMESTAMP_METHOD_NAME = "serverTimestamp";
    private static final Pattern REFERENCE_PATTERN = Pattern.compile("^/?[^/]+/[^/]+(/[^/]+/[^/]+)*$");
    private static final String LATITUDE = "latitude";
    private static final String LONGITUDE = "longitude";
    private static final String STRING_SEPERATOR = "/";
    private static final String SECONDS = "second";
    private static final String NANO_SECONDS = "nanoseconds";

    public FirestorePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class FirestorePluginExecutor implements PluginExecutor<Firestore>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        @Deprecated
        public Mono<ActionExecutionResult> execute(
                Firestore connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            return Mono.error(
                    new AppsmithPluginException(FirestorePluginError.QUERY_EXECUTION_FAILED, "Unsupported Operation"));
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
                Firestore connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage =
                    Thread.currentThread().getName() + ": executeParameterized() called for Firestore plugin.";
            System.out.println(printMessage);
            Object smartSubstitutionObject = actionConfiguration.getFormData().getOrDefault(SMART_SUBSTITUTION, TRUE);
            Boolean smartJsonSubstitution = TRUE;
            if (smartSubstitutionObject instanceof Boolean) {
                smartJsonSubstitution = (Boolean) smartSubstitutionObject;
            } else if (smartSubstitutionObject instanceof String) {
                // Older UI configuration used to set this value as a string which may/may not be castable to a boolean
                // directly. This is to ensure we are backward compatible
                smartJsonSubstitution = Boolean.parseBoolean((String) smartSubstitutionObject);
            }

            // Smartly substitute in actionConfiguration.body and replace all the bindings with values.
            List<Map.Entry<String, String>> parameters = new ArrayList<>();
            if (TRUE.equals(smartJsonSubstitution)) {
                String query = PluginUtils.getDataValueSafelyFromFormData(
                        actionConfiguration.getFormData(), BODY, STRING_TYPE);
                if (query != null) {

                    // First extract all the bindings in order
                    List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
                    // Replace all the bindings with a ? as expected in a prepared statement.
                    String updatedQuery = MustacheHelper.replaceMustacheWithPlaceholder(query, mustacheKeysInOrder);

                    try {
                        updatedQuery = (String) smartSubstitutionOfBindings(
                                updatedQuery, mustacheKeysInOrder, executeActionDTO.getParams(), parameters);
                    } catch (AppsmithPluginException e) {
                        ActionExecutionResult errorResult = new ActionExecutionResult();
                        errorResult.setIsExecutionSuccess(false);
                        errorResult.setErrorInfo(e);
                        return Mono.just(errorResult);
                    }

                    setDataValueSafelyInFormData(actionConfiguration.getFormData(), BODY, updatedQuery);
                }
            }

            // Do the template substitutions.
            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            final Map<String, Object> requestData = new HashMap<>();

            Map<String, Object> formData = actionConfiguration.getFormData();

            String query = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE, "");

            final String path = getDataValueSafelyFromFormData(formData, PATH, STRING_TYPE, "");
            requestData.put("path", path);

            String command = PluginUtils.getDataValueSafelyFromFormData(formData, COMMAND, STRING_TYPE);

            if (isBlank(command)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        FirestoreErrorMessages.MANDATORY_PARAM_COMMAND_MISSING_ERROR_MSG));
            }

            requestData.put("command", command);
            final com.external.plugins.Method method = com.external.plugins.Method.valueOf(command);

            List<RequestParamDTO> requestParams = new ArrayList<>();
            requestParams.add(new RequestParamDTO(COMMAND, command, null, null, null));
            requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

            final PaginationField paginationField =
                    executeActionDTO == null ? null : executeActionDTO.getPaginationField();

            Set<String> hintMessages = new HashSet<>();

            return Mono.justOrEmpty(query)
                    .flatMap(strBody -> {
                        if (method == null) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    FirestoreErrorMessages.MISSING_FIRESTORE_METHOD_ERROR_MSG));
                        }

                        if (isBlank(path)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    FirestoreErrorMessages.EMPTY_DOC_OR_COLLECTION_PATH_ERROR_MSG));
                        }

                        if (path.startsWith("/") || path.endsWith("/")) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    FirestoreErrorMessages.FIRESTORE_PATH_INVALID_STARTING_CHAR_ERROR_MSG));
                        }

                        if (isBlank(strBody)) {
                            switch (method) {
                                case UPDATE_DOCUMENT:
                                case CREATE_DOCUMENT:
                                case ADD_TO_COLLECTION:
                                case SET_DOCUMENT:
                                    /*
                                     * - Need mutable empty hash map to add FieldValue.xyz() values if required.
                                     * - Collections.emptyMap() is immutable.
                                     */
                                    strBody = "{}";
                                    break;
                                default:
                                    return Mono.just(Collections.emptyMap());
                            }
                        }

                        try {
                            System.out.println(Thread.currentThread().getName()
                                    + ": objectMapper.readValue invoked from Firestore plugin.");
                            return Mono.just(objectMapper.readValue(strBody, HashMap.class));
                        } catch (IOException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    FirestoreErrorMessages.QUERY_CONVERSION_TO_HASHMAP_FAILED_ERROR_MSG,
                                    e.getMessage()));
                        }
                    })
                    .flatMap(mapBody -> {
                        if (mapBody.isEmpty()) {

                            if (method.isBodyNeeded()) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        String.format(
                                                FirestoreErrorMessages.NON_EMPTY_BODY_REQUIRED_FOR_METHOD_ERROR_MSG,
                                                method)));
                            }

                            if (isSetOrUpdateOrCreateOrAddMethod(method)
                                    && isTimestampAndDeleteFieldValuePathEmpty(formData)) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        String.format(
                                                FirestoreErrorMessages.NON_EMPTY_FIELD_REQUIRED_FOR_METHOD_ERROR_MSG,
                                                method)));
                            }
                        }

                        try {
                            /*
                             * - Update mapBody with FieldValue.xyz() values if the FieldValue paths are provided.
                             */
                            insertFieldValues(mapBody, formData, method, requestParams);
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }

                        return Mono.just((Map<String, Object>) mapBody);
                    })
                    .flatMap(mapBody -> {
                        if (method.isDocumentLevel()) {
                            return handleDocumentLevelMethod(connection, path, method, mapBody, query, requestParams);
                        } else {
                            return handleCollectionLevelMethod(
                                    connection,
                                    path,
                                    method,
                                    formData,
                                    mapBody,
                                    paginationField,
                                    query,
                                    requestParams,
                                    hintMessages,
                                    actionConfiguration);
                        }
                    })
                    .onErrorResume(error -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                                    FirestoreErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    error);
                        }
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
                    .map(result -> {
                        System.out.println(Thread.currentThread().getName()
                                + ": setting the request in action execution result from Firestore plugin.");
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setProperties(requestData);
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        result.setRequest(request);
                        result.setMessages(hintMessages);
                        return result;
                    })
                    .subscribeOn(scheduler);
        }

        private boolean isTimestampAndDeleteFieldValuePathEmpty(Map<String, Object> formData) {
            if (isBlank(PluginUtils.getDataValueSafelyFromFormData(formData, TIMESTAMP_VALUE_PATH, STRING_TYPE))
                    && isBlank(PluginUtils.getDataValueSafelyFromFormData(formData, DELETE_KEY_PATH, STRING_TYPE))) {
                return true;
            }

            return false;
        }

        private boolean isSetOrUpdateOrCreateOrAddMethod(Method method) {
            return Method.SET_DOCUMENT.equals(method)
                    || Method.UPDATE_DOCUMENT.equals(method)
                    || Method.CREATE_DOCUMENT.equals(method)
                    || Method.ADD_TO_COLLECTION.equals(method);
        }

        /*
         * - Update mapBody with FieldValue.xyz() values if the FieldValue paths are provided.
         */
        private void insertFieldValues(
                Map<String, Object> mapBody,
                Map<String, Object> formData,
                Method method,
                List<RequestParamDTO> requestParams)
                throws AppsmithPluginException {

            /*
             * - Check that FieldValue.delete() option is only available for UPDATE operation.
             */
            if (!Method.UPDATE_DOCUMENT.equals(method)
                    && !isBlank(PluginUtils.getDataValueSafelyFromFormData(formData, DELETE_KEY_PATH, STRING_TYPE))) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        FirestoreErrorMessages.UNEXPECTED_PROPERTY_DELETE_KEY_PATH_ERROR_MSG);
            }

            /*
             * - Parse delete path.
             */
            if (!isBlank(PluginUtils.getDataValueSafelyFromFormData(formData, DELETE_KEY_PATH, STRING_TYPE))) {
                String deletePaths = PluginUtils.getDataValueSafelyFromFormData(formData, DELETE_KEY_PATH, STRING_TYPE);
                requestParams.add(new RequestParamDTO(DELETE_KEY_PATH, deletePaths, null, null, null));
                List<String> deletePathsList;
                try {
                    deletePathsList = objectMapper.readValue(deletePaths, new TypeReference<List<String>>() {});
                } catch (IOException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            FirestoreErrorMessages.FAILED_TO_PARSE_DELETE_KEY_PATH_ERROR_MSG,
                            e.getMessage());
                }

                /*
                 * - Update all the map body keys that need to be deleted.
                 * - This way of denoting a nested path via a "." (dot) notation can only be directly used for a update
                 *   operation. e.g. {"key1.key2": FieldValue.delete()}
                 * - dot notation is used with FieldValue.delete() because otherwise it is not possible to delete
                 *   nested fields. Ref: https://stackoverflow.com/questions/46677132/fieldvalue-delete-can-only-appear-at-the-top-level-of-your-update-data-fires/46677677
                 * - dot notation is safe to use with delete FieldValue because this FieldValue only works with update
                 *   operation.
                 */
                deletePathsList.stream().forEach(path -> mapBody.put(path, FieldValue.delete()));
            }

            /*
             * - Check that FieldValue.serverTimestamp() option is not available for any GET or DELETE operations.
             */
            if (isGetOrDeleteMethod(method)
                    && !isBlank(
                            PluginUtils.getDataValueSafelyFromFormData(formData, TIMESTAMP_VALUE_PATH, STRING_TYPE))) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        FirestoreErrorMessages.UNEXPECTED_PROPERTY_TIMESTAMP_ERROR_MSG);
            }

            /*
             * - Parse severTimestamp FieldValue path.
             */
            if (!isBlank(PluginUtils.getDataValueSafelyFromFormData(formData, TIMESTAMP_VALUE_PATH, STRING_TYPE))) {
                String timestampValuePaths =
                        PluginUtils.getDataValueSafelyFromFormData(formData, TIMESTAMP_VALUE_PATH, STRING_TYPE);
                requestParams.add(new RequestParamDTO(TIMESTAMP_VALUE_PATH, timestampValuePaths, null, null, null));
                List<String> timestampPathsStringList; // ["key1.key2", "key3.key4"]
                try {
                    timestampPathsStringList =
                            objectMapper.readValue(timestampValuePaths, new TypeReference<List<String>>() {});
                } catch (IOException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            FirestoreErrorMessages.FAILED_TO_PARSE_TIMESTAMP_VALUE_PATH_ERROR_MSG,
                            e.getMessage());
                }

                /*
                 * - Update all the map body keys that need to store timestamp.
                 * - Since serverTimestamp FieldValue can be used with non update operations like create and set, "."
                 *   (dot) notation cannot be directly used to refer to nested paths.
                 * - We cannot use the dotted notation directly with timestamp FieldValue because during set/create
                 *   actions, the dotted string is considered as a single key instead of nested path.
                 * - Convert ["key1.key2", "key3.key4"] to [["key1", "key2"], ["key3", "key4"]]
                 */
                List<List<String>> timestampPathsArrayList = new ArrayList<>();
                timestampPathsStringList.stream()
                        .forEach(dottedPath -> timestampPathsArrayList.add(List.of(dottedPath.split("\\."))));
                insertFieldValueByMethodName(mapBody, timestampPathsArrayList, FIELDVALUE_TIMESTAMP_METHOD_NAME);
            }
        }

        private boolean isGetOrDeleteMethod(Method method) {
            return Method.GET_DOCUMENT.equals(method)
                    || Method.GET_COLLECTION.equals(method)
                    || Method.DELETE_DOCUMENT.equals(method);
        }

        /*
         * - A common method that can be used for any FieldValue option.
         * - It iterates over the map body and replaces the value of keys defined by pathsList with a FieldValue
         *   entity defined by fieldValueName.
         */
        private void insertFieldValueByMethodName(
                Map<String, Object> mapBody, List<List<String>> pathsList, String fieldValueName) {

            pathsList.stream()
                    .filter(singlePathList -> !CollectionUtils.isEmpty(singlePathList))
                    .forEach(singlePathList -> {
                        /*
                         * - Unable to convert this for loop into a stream implementation. Please offer suggestions
                         *   if possible.
                         */
                        HashMap<String, Object> targetKeyValuePair = (HashMap<String, Object>) mapBody;
                        for (int i = 0; i < singlePathList.size() - 1; i++) {

                            String key = singlePathList.get(i);

                            /*
                             * - Construct json object, if not present, based on the path provided.
                             */
                            if (targetKeyValuePair.get(key) == null) {
                                String nextKey = singlePathList.get(i + 1);
                                final Map<String, ?> pair = new HashMap<>();
                                pair.put(nextKey, null);
                                targetKeyValuePair.put(key, pair);
                            }

                            /*
                             * - Traverse nested json object.
                             */
                            targetKeyValuePair = (HashMap<String, Object>) targetKeyValuePair.get(key);
                        }

                        try {
                            targetKeyValuePair.put(
                                    singlePathList.get(singlePathList.size() - 1),
                                    /*
                                     * - As per Java documentation: If the underlying method is static, then the
                                     *   specified obj argument is ignored. It may be null.
                                     * - Ref: https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Method.html#invoke-java.lang.Object-java.lang.Object...-
                                     */
                                    FieldValue.class.getMethod(fieldValueName).invoke(null));
                        } catch (NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
                            /*
                             * - Please offer suggestions if this exception can be handled in a better way.
                             */
                            throw new RuntimeException(e);
                        }
                    });
        }

        public Mono<ActionExecutionResult> handleDocumentLevelMethod(
                Firestore connection,
                String path,
                com.external.plugins.Method method,
                Map<String, Object> mapBody,
                String query,
                List<RequestParamDTO> requestParams) {
            String printMessage =
                    Thread.currentThread().getName() + ": handleDocumentLevelMethod() called for Firestore plugin.";
            System.out.println(printMessage);
            return Mono.just(method)
                    // Get the actual Java method to be called.
                    .flatMap(method1 -> {
                        final String methodName =
                                method1.toString().split("_")[0].toLowerCase();
                        try {
                            switch (method1) {
                                case GET_DOCUMENT:
                                case DELETE_DOCUMENT:
                                    return Mono.justOrEmpty(DocumentReference.class.getMethod(methodName));
                                case SET_DOCUMENT:
                                case CREATE_DOCUMENT:
                                case UPDATE_DOCUMENT:
                                    requestParams.add(
                                            new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));
                                    return Mono.justOrEmpty(DocumentReference.class.getMethod(methodName, Map.class));
                                default:
                                    return Mono.error(new AppsmithPluginException(
                                            FirestorePluginError.QUERY_EXECUTION_FAILED,
                                            String.format(
                                                    FirestoreErrorMessages.INVALID_DOCUMENT_LEVEL_METHOD_ERROR_MSG,
                                                    method1)));
                            }

                        } catch (NoSuchMethodException e) {
                            return Mono.error(new AppsmithPluginException(
                                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                                    String.format(FirestoreErrorMessages.ACTUAL_METHOD_GETTING_ERROR_MSG, method1),
                                    e.getMessage()));
                        }
                    })
                    // Call that method and get a Future of the result.
                    .flatMap(operationMethod -> {
                        DocumentReference document = connection.document(path);
                        Object objFuture;

                        try {
                            if (operationMethod.getParameterCount() == 1) {
                                objFuture = operationMethod.invoke(document, mapBody);
                            } else {
                                objFuture = operationMethod.invoke(document);
                            }

                        } catch (IllegalAccessException | InvocationTargetException e) {
                            /*
                             * - Printing the stack because e.getMessage() returns null for FieldValue errors.
                             */
                            e.printStackTrace();
                            return Mono.error(new AppsmithPluginException(
                                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                                    FirestoreErrorMessages.METHOD_INVOCATION_FAILED_ERROR_MSG,
                                    e.getMessage()));
                        }

                        return Mono.just((ApiFuture<Object>) objFuture);
                    })
                    // Consume the Future to get the actual result object.
                    .flatMap(resultFuture -> {
                        try {

                            return Mono.just(resultFuture.get());
                        } catch (InterruptedException | ExecutionException e) {
                            return Mono.error(new AppsmithPluginException(
                                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                                    FirestoreErrorMessages.FAILURE_IN_GETTING_RESULT_FROM_FUTURE_ERROR_MSG,
                                    e.getMessage()));
                        }
                    })
                    // Build a response object with the result.
                    .flatMap(objResult1 -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        try {
                            result.setBody(resultToMap(objResult1));
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }
                        result.setIsExecutionSuccess(true);
                        return Mono.just(result);
                    });
        }

        public Mono<ActionExecutionResult> handleCollectionLevelMethod(
                Firestore connection,
                String path,
                Method method,
                Map<String, Object> formData,
                Map<String, Object> mapBody,
                PaginationField paginationField,
                String query,
                List<RequestParamDTO> requestParams,
                Set<String> hintMessages,
                ActionConfiguration actionConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": handleCollectionLevelMethod() called for Firestore plugin.";
            System.out.println(printMessage);
            final CollectionReference collection = connection.collection(path);

            if (method == Method.GET_COLLECTION) {
                return methodGetCollection(
                        collection, formData, paginationField, requestParams, hintMessages, actionConfiguration);

            } else if (method == Method.ADD_TO_COLLECTION) {
                requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));
                return methodAddToCollection(collection, mapBody);
            }

            return Mono.error(new AppsmithPluginException(
                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                    String.format(FirestoreErrorMessages.UNSUPPORTED_COLLECTION_METHOD_ERROR_MSG, method)));
        }

        private Mono<ActionExecutionResult> methodGetCollection(
                CollectionReference query,
                Map<String, Object> formData,
                PaginationField paginationField,
                List<RequestParamDTO> requestParams,
                Set<String> hintMessages,
                ActionConfiguration actionConfiguration) {
            final String limitString =
                    PluginUtils.getDataValueSafelyFromFormData(formData, LIMIT_DOCUMENTS, STRING_TYPE);
            final int limit = StringUtils.isEmpty(limitString) ? 10 : Integer.parseInt(limitString);
            final String orderByString =
                    PluginUtils.getDataValueSafelyFromFormData(formData, ORDER_BY, STRING_TYPE, "");
            requestParams.add(new RequestParamDTO(ORDER_BY, orderByString, null, null, null));

            final List<String> orderings;
            try {
                orderings = StringUtils.isEmpty(orderByString)
                        ? Collections.emptyList()
                        : objectMapper.readValue(orderByString, List.class);
            } catch (IOException e) {
                // TODO: Investigate how many actions are using this today on prod.
                return Mono.error(
                        new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, orderByString, e));
            }

            Map<String, Object> startAfterTemp = null;
            String startAfterJson = getDataValueSafelyFromFormData(formData, NEXT, STRING_TYPE, "{}");
            if (StringUtils.isEmpty(startAfterJson)) {
                startAfterJson = "{}";
            }
            requestParams.add(new RequestParamDTO(START_AFTER, startAfterJson, null, null, null));
            if (PaginationField.NEXT.equals(paginationField)) {
                try {
                    startAfterTemp = StringUtils.isEmpty(startAfterJson)
                            ? Collections.emptyMap()
                            : objectMapper.readValue(startAfterJson, Map.class);
                } catch (IOException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, startAfterJson, e));
                }
            }

            Map<String, Object> endBeforeTemp = null;
            String endBeforeJson = getDataValueSafelyFromFormData(formData, PREV, STRING_TYPE, "{}");
            if (StringUtils.isEmpty(endBeforeJson)) {
                endBeforeJson = "{}";
            }
            requestParams.add(new RequestParamDTO(END_BEFORE, endBeforeJson, null, null, null));
            if (PaginationField.PREV.equals(paginationField)) {
                try {
                    endBeforeTemp = StringUtils.isEmpty(endBeforeJson)
                            ? Collections.emptyMap()
                            : objectMapper.readValue(endBeforeJson, Map.class);
                } catch (IOException e) {
                    return Mono.error(
                            new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, endBeforeJson, e));
                }
            }

            requestParams.add(
                    new RequestParamDTO(LIMIT_DOCUMENTS, limitString == null ? "" : limitString, null, null, null));

            final Map<String, Object> startAfter = startAfterTemp;
            final Map<String, Object> endBefore = endBeforeTemp;

            if (paginationField != null && CollectionUtils.isEmpty(orderings)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        FirestoreErrorMessages.PAGINATION_WITHOUT_SPECIFYING_ORDERING_ERROR_MSG));
            }

            return Mono.just(query)
                    // Apply where condition, if provided.
                    .flatMap(q -> {
                        Query query1 = q;
                        if (!isWhereMethodUsed(formData)) {
                            return Mono.just(query1);
                        }

                        Map<String, List<Map<String, String>>> childrenMap =
                                PluginUtils.getDataValueSafelyFromFormData(formData, WHERE, new TypeReference<>() {});
                        final List<Map<String, String>> conditionList = childrenMap.get("children");
                        requestParams.add(new RequestParamDTO(WHERE, conditionList, null, null, null));

                        for (Map<String, String> condition : conditionList) {
                            String path = condition.get("key");
                            String operatorString = condition.get("condition");
                            String value = condition.get("value");

                            if (StringUtils.isEmpty(path)
                                    || StringUtils.isEmpty(operatorString)
                                    || StringUtils.isEmpty(value)) {
                                String emptyConditionMessage = "At least one of the conditions in the 'where' clause "
                                        + "has missing operator or operand(s). These conditions were ignored during the"
                                        + " execution of the query.";
                                hintMessages.add(emptyConditionMessage);
                                continue;
                            }

                            try {
                                query1 = applyWhereConditional(query1, path, operatorString, value);
                            } catch (AppsmithPluginException e) {
                                return Mono.error(e);
                            }
                        }

                        return Mono.just(query1);
                    })
                    // Apply ordering, if provided.
                    .map(query1 -> {
                        Query q = query1;
                        final List<Object> startAfterValues = new ArrayList<>();
                        final List<Object> endBeforeValues = new ArrayList<>();
                        for (final String field : orderings) {
                            q = q.orderBy(
                                    field.replaceAll("^-", ""),
                                    field.startsWith("-") ? Query.Direction.DESCENDING : Query.Direction.ASCENDING);
                            if (startAfter != null) {
                                startAfterValues.add(startAfter.get(field));
                            }
                            if (endBefore != null) {
                                endBeforeValues.add(endBefore.get(field));
                            }
                        }
                        if (PaginationField.NEXT.equals(paginationField) && !CollectionUtils.isEmpty(startAfter)) {
                            q = q.startAfter(startAfterValues.toArray());
                        } else if (PaginationField.PREV.equals(paginationField)
                                && !CollectionUtils.isEmpty(endBefore)) {
                            q = q.endBefore(endBeforeValues.toArray());
                        }
                        return q;
                    })
                    // Apply limit, always provided, since without it, we can inadvertently end up processing too much
                    // data.
                    .map(query1 -> {
                        if (PaginationField.PREV.equals(paginationField) && !CollectionUtils.isEmpty(endBefore)) {
                            return query1.limitToLast(limit);
                        }
                        return query1.limit(limit);
                    })
                    // Run the Firestore query to get a Future of the results.
                    .map(Query::get)
                    // Consume the future to get the actual results.
                    .flatMap(resultFuture -> {
                        try {
                            return Mono.just(resultFuture.get());
                        } catch (InterruptedException | ExecutionException e) {
                            return Mono.error(new AppsmithPluginException(
                                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                                    FirestoreErrorMessages.FAILURE_IN_GETTING_RESULT_FROM_FUTURE_ERROR_MSG,
                                    e.getMessage()));
                        }
                    })
                    // Build response object with the results from the Future.
                    .flatMap(objResult1 -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        try {
                            result.setBody(resultToMap(objResult1));
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }
                        result.setIsExecutionSuccess(true);
                        return Mono.just(result);
                    });
        }

        private boolean isWhereMethodUsed(Map<String, Object> formData) {
            final Map<String, List<Object>> childrenMap =
                    getDataValueSafelyFromFormData(formData, WHERE, new TypeReference<>() {});

            if (childrenMap == null || childrenMap.isEmpty()) {
                return false;
            }
            List<Object> conditionList = childrenMap.get("children");

            // Check if the where clause does not exist
            if (CollectionUtils.isEmpty(conditionList)) {
                return false;
            }

            // Check if all keys in the where clause are null.
            boolean allValuesNull =
                    conditionList.stream().allMatch(condition -> isBlank((String) ((Map) condition).get("key")));

            if (allValuesNull) {
                return false;
            }

            return true;
        }

        private Mono<ActionExecutionResult> methodAddToCollection(
                CollectionReference collection, Map<String, Object> mapBody) {

            mapBody.replaceAll((key, value) -> checkAndConvertDataType(value, collection));

            return Mono.justOrEmpty(collection.add(mapBody))
                    .flatMap(future -> {
                        try {
                            return Mono.just(future.get());
                        } catch (InterruptedException | ExecutionException e) {
                            return Mono.error(new AppsmithPluginException(
                                    FirestorePluginError.QUERY_EXECUTION_FAILED,
                                    FirestoreErrorMessages.FAILURE_IN_GETTING_RESULT_FROM_FUTURE_ERROR_MSG,
                                    e.getMessage()));
                        }
                    })
                    .flatMap(opResult -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        try {
                            result.setBody(resultToMap(opResult));
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }
                        result.setIsExecutionSuccess(true);
                        return Mono.just(result);
                    });
        }

        private Object checkAndConvertDataType(Object value, CollectionReference collection) {
            if (value instanceof Map<?, ?> mapValue) {
                if (mapValue.containsKey(SECONDS) && mapValue.containsKey(NANO_SECONDS)) {
                    long seconds = ((Number) mapValue.get(SECONDS)).longValue();
                    int nanos = ((Number) mapValue.get(NANO_SECONDS)).intValue();
                    return Timestamp.ofTimeSecondsAndNanos(seconds, nanos);
                } else if (mapValue.containsKey(LATITUDE) && mapValue.containsKey(LONGITUDE)) {
                    double latitude = ((Number) mapValue.get(LATITUDE)).doubleValue();
                    double longitude = ((Number) mapValue.get(LONGITUDE)).doubleValue();
                    return new GeoPoint(latitude, longitude);
                }
            } else if (value instanceof String stringValue) {
                // Validate the string as a Firestore document reference using regex
                if (REFERENCE_PATTERN.matcher(stringValue).matches()) {
                    // Remove leading slash if present
                    if (stringValue.startsWith(STRING_SEPERATOR)) {
                        stringValue = stringValue.substring(1);
                    }
                    return collection.getFirestore().document(stringValue);
                }
            }
            return value;
        }

        private Object resultToMap(Object objResult) throws AppsmithPluginException {
            return resultToMap(objResult, true);
        }

        private Object resultToMap(Object objResult, boolean isRoot) throws AppsmithPluginException {
            if (objResult instanceof WriteResult) {
                WriteResult writeResult = (WriteResult) objResult;
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("lastUpdateTime", writeResult.getUpdateTime());
                return resultMap;

            } else if (objResult instanceof DocumentSnapshot) {
                // Individual document.
                DocumentSnapshot documentSnapshot = (DocumentSnapshot) objResult;
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("_ref", resultToMap(documentSnapshot.getReference()));
                if (documentSnapshot.getData() != null) {
                    for (final Map.Entry<String, Object> entry :
                            documentSnapshot.getData().entrySet()) {
                        resultMap.put(entry.getKey(), resultToMap(entry.getValue(), false));
                    }
                }
                return resultMap;

            } else if (objResult instanceof QuerySnapshot) {
                // Result of a GET_COLLECTION operation.
                return resultToMap(((QuerySnapshot) objResult).getDocuments());

            } else if (objResult instanceof DocumentReference) {
                // A reference containing details of another document.

                DocumentReference documentReference = (DocumentReference) objResult;
                return Map.of(
                        "id", documentReference.getId(),
                        "path", documentReference.getPath());

            } else if (objResult instanceof Map) {
                Map<String, Object> resultMap = (Map) objResult;
                for (final Map.Entry<String, Object> entry : resultMap.entrySet()) {
                    resultMap.put(entry.getKey(), resultToMap(entry.getValue(), false));
                }
                return resultMap;

            } else if (objResult instanceof List) {
                List<Object> original = (List) objResult;
                List<Object> converted = new ArrayList<>();
                for (final Object item : original) {
                    converted.add(resultToMap(item, false));
                }
                return converted;

            } else if (objResult instanceof Timestamp) {
                // Handle Firestore Timestamp directly
                Timestamp timestamp = (Timestamp) objResult;
                // Convert to ISO 8601 string or any preferred format
                return timestamp.toSqlTimestamp().toInstant().toString();

            } else if (objResult instanceof GeoPoint) {
                GeoPoint geoPoint = (GeoPoint) objResult;
                return String.format("POINT(%f %f)", geoPoint.getLatitude(), geoPoint.getLongitude());

            } else if (isRoot) {
                throw new AppsmithPluginException(
                        FirestorePluginError.QUERY_EXECUTION_FAILED,
                        String.format(
                                FirestoreErrorMessages.OBJECT_SERIALIZATION_FAILED_ERROR_MSG,
                                objResult.getClass().getName()));
            }

            return objResult;
        }

        @Override
        public Mono<Firestore> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": datasourceCreate() called for Firestore plugin.";
            System.out.println(printMessage);
            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            final Set<String> errors = validateDatasource(datasourceConfiguration);
            if (!CollectionUtils.isEmpty(errors)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        errors.iterator().next()));
            }

            final String projectId = authentication.getUsername();
            final String clientJson = authentication.getPassword();

            InputStream serviceAccount = new ByteArrayInputStream(clientJson.getBytes());

            return Mono.fromSupplier(() -> {
                        System.out.println(Thread.currentThread().getName()
                                + ": instantiating googlecredentials object from Firestore plugin.");
                        GoogleCredentials credentials;
                        try {
                            credentials = GoogleCredentials.fromStream(serviceAccount);
                        } catch (IOException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    FirestoreErrorMessages.DS_VALIDATION_FAILED_FOR_SERVICE_ACC_CREDENTIALS_ERROR_MSG,
                                    e.getMessage()));
                        }

                        return FirebaseOptions.builder()
                                .setDatabaseUrl(datasourceConfiguration.getUrl())
                                .setProjectId(projectId)
                                .setCredentials(credentials)
                                .build();
                    })
                    .onErrorMap(Exceptions::unwrap)
                    .map(options -> {
                        try {
                            return FirebaseApp.getInstance(projectId);
                        } catch (IllegalStateException e) {
                            return FirebaseApp.initializeApp(options, projectId);
                        }
                    })
                    .map(FirestoreClient::getFirestore)
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for Firestore plugin.";
            System.out.println(printMessage);
            return datasourceCreate(datasourceConfiguration).flatMap(connection -> {
                try {
                    connection.listCollections();
                } catch (FirestoreException e) {
                    System.out.println("Invalid datasource configuration: " + e.getMessage());
                    if (e.getMessage().contains("Metadata operations require admin authentication")) {
                        DatasourceTestResult datasourceTestResult = new DatasourceTestResult();
                        datasourceTestResult.setMessages(new HashSet<>(
                                Collections.singletonList(FirestoreErrorMessages.META_DATA_ACCESS_MISSING_MESSAGE)));
                        return Mono.just(datasourceTestResult);
                    }
                    return Mono.just(
                            new DatasourceTestResult(FirestoreErrorMessages.DS_CONNECTION_FAILED_FOR_PROJECT_ID));
                }
                return Mono.just(new DatasourceTestResult());
            });
        }

        @Override
        public void datasourceDestroy(Firestore connection) {
            // This is empty because there's no concept of destroying a Firestore connection here.
            // When the datasource is updated, the FirebaseApp instance will delete & re-create the app
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for Firestore plugin.";
            System.out.println(printMessage);
            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            Set<String> invalids = new HashSet<>();

            if (authentication == null) {
                invalids.add(FirestoreErrorMessages.DS_MISSING_PROJECT_ID_AND_CLIENTJSON_ERROR_MSG);

            } else {
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add(FirestoreErrorMessages.DS_MISSING_PROJECT_ID_ERROR_MSG);
                }

                if (StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add(FirestoreErrorMessages.DS_MISSING_CLIENTJSON_ERROR_MSG);
                }
            }

            if (isBlank(datasourceConfiguration.getUrl())) {
                invalids.add(FirestoreErrorMessages.DS_MISSING_FIRESTORE_URL_ERROR_MSG);
            }
            return invalids;
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                Firestore connection, DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": getStructure() called for Firestore plugin.";
            System.out.println(printMessage);
            return Mono.fromSupplier(() -> {
                        System.out.println(Thread.currentThread().getName()
                                + ": invoking connection.listCollections() from Firestore plugin.");
                        Iterable<CollectionReference> collectionReferences = connection.listCollections();

                        List<DatasourceStructure.Table> tables = StreamSupport.stream(
                                        collectionReferences.spliterator(), false)
                                .map(collectionReference -> {
                                    String id = collectionReference.getId();
                                    final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                                    return new DatasourceStructure.Table(
                                            DatasourceStructure.TableType.COLLECTION,
                                            null,
                                            id,
                                            new ArrayList<>(),
                                            new ArrayList<>(),
                                            templates);
                                })
                                .collect(Collectors.toList());

                        DatasourceStructure structure = new DatasourceStructure();
                        structure.setTables(tables);

                        return structure;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Set<String> getSelfReferencingDataPaths() {
            return Set.of(
                    "formData.prev.data", "formData.next.data", "formData.startAfter.data", "formData.endBefore.data");
        }
    }
}
