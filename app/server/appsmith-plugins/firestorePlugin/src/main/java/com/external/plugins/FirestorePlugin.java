package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.core.type.TypeReference;
import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
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
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.helpers.PluginUtils.getActionConfigurationPropertyPath;
import static com.external.utils.WhereConditionUtils.applyWhereConditional;

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

    private static final int ORDER_PROPERTY_INDEX = 1;
    private static final int LIMIT_PROPERTY_INDEX = 2;
    private static final int WHERE_CONDITIONAL_PROPERTY_INDEX = 3;
    private static final int START_AFTER_PROPERTY_INDEX = 6;
    private static final int END_BEFORE_PROPERTY_INDEX = 7;
    private static final int FIELDVALUE_TIMESTAMP_PROPERTY_INDEX = 8;
    private static final int FIELDVALUE_DELETE_PROPERTY_INDEX = 9;
    private static final String FIELDVALUE_TIMESTAMP_METHOD_NAME = "serverTimestamp";

    public FirestorePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class FirestorePluginExecutor implements PluginExecutor<Firestore> {

        private final Scheduler scheduler = Schedulers.elastic();

        @Override
        @Deprecated
        public Mono<ActionExecutionResult> execute(Firestore connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                Firestore connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            // Do the template substitutions.
            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            final Map<String, Object> requestData = new HashMap<>();

            String query = actionConfiguration.getBody();

            final String path = actionConfiguration.getPath();
            requestData.put("path", path == null ? "" : path);

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            final com.external.plugins.Method method = CollectionUtils.isEmpty(properties)
                    ? null
                    : com.external.plugins.Method.valueOf((String) properties.get(0).getValue());
            requestData.put("method", method == null ? "" : method.toString());

            List<RequestParamDTO> requestParams = new ArrayList<>();
            requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0), method == null ? "" :
                    method.toString(), null, null, null));
            requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

            final PaginationField paginationField = executeActionDTO == null ? null : executeActionDTO.getPaginationField();

            return Mono
                    .justOrEmpty(actionConfiguration.getBody())
                    .defaultIfEmpty("")
                    .flatMap(strBody -> {

                        if (StringUtils.isBlank(path)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Document/Collection path cannot be empty"
                            ));
                        }

                        if (path.startsWith("/") || path.endsWith("/")) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Firestore paths should not begin or end with `/` character."
                            ));
                        }

                        if (method == null) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Missing Firestore method."
                            ));
                        }

                        if (StringUtils.isBlank(strBody)) {
                            switch(method) {
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
                            return Mono.just(objectMapper.readValue(strBody, HashMap.class));
                        } catch (IOException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    e.getMessage()
                            ));
                        }
                    })
                    .flatMap(mapBody -> {

                        if (mapBody.isEmpty()) {
                            if(method.isBodyNeeded()) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        "The method " + method.toString() + " needs a non-empty body to work."
                                ));
                            }

                            /*
                             * - If body and all of the FieldValue paths are empty, then return error.
                             * - Not applicable to GET and DELETE methods.
                             */
                            if ((Method.SET_DOCUMENT.equals(method) || Method.UPDATE_DOCUMENT.equals(method)
                                    || Method.CREATE_DOCUMENT.equals(method) || Method.ADD_TO_COLLECTION.equals(method))
                                    && (properties == null || ((properties.size() < FIELDVALUE_TIMESTAMP_PROPERTY_INDEX + 1
                                    || properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX) == null
                                    || StringUtils.isEmpty((String) properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX).getValue()))
                                    && (properties.size() < FIELDVALUE_DELETE_PROPERTY_INDEX
                                    || properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX) == null
                                    || StringUtils.isEmpty((String) properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX).getValue()))))) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        "The method " + method.toString() + " needs at least one of the following " +
                                                "fields to be non-empty: 'Timestamp Value Path', 'Delete Key Value " +
                                                "Pair Path', 'Body'"
                                ));
                            }
                        }

                        try {
                            /*
                             * - Update mapBody with FieldValue.xyz() values if the FieldValue paths are provided.
                             */
                            insertFieldValues(mapBody, properties, method, requestParams);
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }

                        return Mono.just((Map<String, Object>) mapBody);
                    })
                    .flatMap(mapBody -> {
                        if (method.isDocumentLevel()) {
                            return handleDocumentLevelMethod(connection, path, method, mapBody, query, requestParams);
                        } else {
                            return handleCollectionLevelMethod(connection, path, method, properties, mapBody,
                                    paginationField, query, requestParams);
                        }
                    })
                    .onErrorResume(error  -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned back to the server
                    .map(result -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setProperties(requestData);
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);
        }

        /*
         * - Update mapBody with FieldValue.xyz() values if the FieldValue paths are provided.
         */
        private void insertFieldValues(Map<String, Object> mapBody,
                                       List<Property> properties,
                                       Method method,
                                       List<RequestParamDTO> requestParams) throws AppsmithPluginException {

            /*
             * - Check that FieldValue.delete() option is only available for UPDATE operation.
             */
            if(!Method.UPDATE_DOCUMENT.equals(method)
                    && properties.size() > FIELDVALUE_DELETE_PROPERTY_INDEX
                    && properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX) != null
                    && !StringUtils.isEmpty((String) properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX).getValue())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith has found an unexpected query form property - 'Delete Key Value Pair Path'. Please " +
                                "reach out to Appsmith customer support to resolve this."
                );
            }

            /*
             * - Parse delete path.
             */
            if( properties.size() > FIELDVALUE_DELETE_PROPERTY_INDEX
                    && properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX) != null
                    && !StringUtils.isEmpty((String) properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX).getValue())) {
                String deletePaths = (String) properties.get(FIELDVALUE_DELETE_PROPERTY_INDEX).getValue();
                requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(FIELDVALUE_DELETE_PROPERTY_INDEX),
                        deletePaths, null, null, null));
                List<String> deletePathsList;
                try {
                    deletePathsList = objectMapper.readValue(deletePaths, new TypeReference<List<String>>(){});
                } catch (IOException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Appsmith failed to parse the query editor form field 'Delete Key Value Pair Path'. " +
                                    "Please check out Appsmith's documentation to find the correct syntax."
                    );
                }

                /*
                 * - Update all of the map body keys that need to be deleted.
                 * - This way of denoting a nested path via a "." (dot) notation can only be directly used for a update
                 *   operation. e.g. {"key1.key2": FieldValue.delete()}
                 * - dot notation is used with FieldValue.delete() because otherwise it is not possible to delete
                 *   nested fields. Ref: https://stackoverflow.com/questions/46677132/fieldvalue-delete-can-only-appear-at-the-top-level-of-your-update-data-fires/46677677
                 * - dot notation is safe to use with delete FieldValue because this FieldValue only works with update
                 *   operation.
                 */
                deletePathsList.stream()
                        .forEach(path -> mapBody.put(path, FieldValue.delete()));
            }

            /*
             * - Check that FieldValue.serverTimestamp() option is not available for any GET or DELETE operations.
             */
            if((Method.GET_DOCUMENT.equals(method)
                    || Method.GET_COLLECTION.equals(method)
                    || Method.DELETE_DOCUMENT.equals(method))
                    && properties.size() > FIELDVALUE_TIMESTAMP_PROPERTY_INDEX
                    && properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX) != null
                    && !StringUtils.isEmpty((String) properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX).getValue())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith has found an unexpected query form property - 'Timestamp Value Path'. Please reach " +
                                "out to Appsmith customer support to resolve this."
                );
            }

            /*
             * - Parse severTimestamp FieldValue path.
             */
            if(properties.size() > FIELDVALUE_TIMESTAMP_PROPERTY_INDEX
                    && properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX) != null
                    && !StringUtils.isEmpty((String) properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX).getValue())) {
                String timestampValuePaths = (String) properties.get(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX).getValue();
                requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(FIELDVALUE_TIMESTAMP_PROPERTY_INDEX),
                        timestampValuePaths, null, null, null));
                List<String> timestampPathsStringList; // ["key1.key2", "key3.key4"]
                try {
                    timestampPathsStringList = objectMapper.readValue(timestampValuePaths,
                            new TypeReference<List<String>>(){});
                } catch (IOException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Appsmith failed to parse the query editor form field 'Timestamp Value Path'. " +
                                    "Please check out Appsmith's documentation to find the correct syntax."
                    );
                }

                /*
                 * - Update all of the map body keys that need to store timestamp.
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

        /*
         * - A common method that can be used for any FieldValue option.
         * - It iterates over the map body and replaces the value of keys defined by pathsList with a FieldValue
         *   entity defined by fieldValueName.
         */
        private void insertFieldValueByMethodName(Map<String, Object> mapBody,
                                            List<List<String>> pathsList,
                                            String fieldValueName) {

            pathsList.stream()
                    .filter(singlePathList -> !CollectionUtils.isEmpty(singlePathList))
                    .forEach(singlePathList -> {
                        /*
                         * - Unable to convert this for loop into a stream implementation. Please offer suggestions
                         *   if possible.
                         */
                        HashMap<String, Object> targetKeyValuePair = (HashMap<String, Object>) mapBody;
                        for(int i=0; i<singlePathList.size()-1; i++) {

                            String key = singlePathList.get(i);

                            /*
                             * - Construct json object, if not present, based on the path provided.
                             */
                            if(targetKeyValuePair.get(key) == null) {
                                String nextKey = singlePathList.get(i + 1);
                                targetKeyValuePair.put(key, new HashMap<>() {{put(nextKey, null);}});
                            }

                            /*
                             * - Traverse nested json object.
                             */
                            targetKeyValuePair = (HashMap<String, Object>)targetKeyValuePair.get(key);
                        }

                        try {
                            targetKeyValuePair.put(
                                    singlePathList.get(singlePathList.size()-1),
                                    /*
                                     * - As per Java documentation: If the underlying method is static, then the
                                     *   specified obj argument is ignored. It may be null.
                                     * - Ref: https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Method.html#invoke-java.lang.Object-java.lang.Object...-
                                     */
                                    FieldValue.class.getMethod(fieldValueName).invoke(null)
                            );
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
                List<RequestParamDTO> requestParams
        ) {
            return Mono.just(method)
                    // Get the actual Java method to be called.
                    .flatMap(method1 -> {


                        final String methodName = method1.toString().split("_")[0].toLowerCase();
                        try {
                            switch (method1) {
                                case GET_DOCUMENT:
                                case DELETE_DOCUMENT:
                                    return Mono.justOrEmpty(DocumentReference.class.getMethod(methodName));
                                case SET_DOCUMENT:
                                case CREATE_DOCUMENT:
                                case UPDATE_DOCUMENT:
                                    requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,  query, null,
                                            null, null));
                                    return Mono.justOrEmpty(DocumentReference.class.getMethod(methodName, Map.class));
                                default:
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_ERROR,
                                            "Invalid document-level method " + method1.toString()
                                    ));
                            }

                        } catch (NoSuchMethodException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Error getting actual method for operation " + method1.toString()
                            ));

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
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));

                        }

                        return Mono.just((ApiFuture<Object>) objFuture);
                    })
                    // Consume the Future to get the actual result object.
                    .flatMap(resultFuture -> {
                        try {

                            return Mono.just(resultFuture.get());
                        } catch (InterruptedException | ExecutionException e) {
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
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
                        System.out.println(
                                Thread.currentThread().getName()
                                        + ": In the Firestore Plugin, got action execution result");
                        return Mono.just(result);
                    });
        }

        public Mono<ActionExecutionResult> handleCollectionLevelMethod(
                Firestore connection,
                String path,
                Method method,
                List<Property> properties,
                Map<String, Object> mapBody,
                PaginationField paginationField,
                String query,
                List<RequestParamDTO> requestParams) {

            final CollectionReference collection = connection.collection(path);

            if (method == Method.GET_COLLECTION) {
                return methodGetCollection(collection, properties, paginationField, requestParams);

            } else if (method == Method.ADD_TO_COLLECTION) {
                requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,  query, null, null, null));
                return methodAddToCollection(collection, mapBody);

            }

            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Unsupported collection-level command: " + method
            ));
        }

        private String getPropertyAt(List<Property> properties, int index, String defaultValue) {
            if (properties.size() <= index) {
                return defaultValue;
            }

            final Property property = properties.get(index);
            if (property == null) {
                return defaultValue;
            }

            final String value = (String) property.getValue();
            return value != null ? value : defaultValue;
        }

        private Mono<ActionExecutionResult> methodGetCollection(CollectionReference query, List<Property> properties,
                                                                PaginationField paginationField,
                                                                List<RequestParamDTO> requestParams) {
            final String limitString = getPropertyAt(properties, LIMIT_PROPERTY_INDEX, "10");
            final int limit = StringUtils.isEmpty(limitString) ? 10 : Integer.parseInt(limitString);
            final String orderByString = getPropertyAt(properties, ORDER_PROPERTY_INDEX, "");
            requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(ORDER_PROPERTY_INDEX),
                    orderByString, null, null, null));

            final List<String> orderings;
            try {
                orderings = StringUtils.isEmpty(orderByString) ? Collections.emptyList() : objectMapper.readValue(orderByString, List.class);
            } catch (IOException e) {
                // TODO: Investigate how many actions are using this today on prod.
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, orderByString, e));
            }

            Map<String, Object> startAfterTemp = null;
            final String startAfterJson = getPropertyAt(properties, START_AFTER_PROPERTY_INDEX, "{}");
            requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(START_AFTER_PROPERTY_INDEX),
                    startAfterJson, null, null, null));
            if (PaginationField.NEXT.equals(paginationField)) {
                try {
                    startAfterTemp = StringUtils.isEmpty(startAfterJson) ? Collections.emptyMap() : objectMapper.readValue(startAfterJson, Map.class);
                } catch (IOException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, startAfterJson, e));
                }
            }

            Map<String, Object> endBeforeTemp = null;
            final String endBeforeJson = getPropertyAt(properties, END_BEFORE_PROPERTY_INDEX, "{}");
            requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(END_BEFORE_PROPERTY_INDEX),
                    endBeforeJson, null, null, null));
            if (PaginationField.PREV.equals(paginationField)) {
                try {
                    endBeforeTemp = StringUtils.isEmpty(endBeforeJson) ? Collections.emptyMap() : objectMapper.readValue(endBeforeJson, Map.class);
                } catch (IOException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, endBeforeJson, e));
                }
            }

            requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(LIMIT_PROPERTY_INDEX),
                    limitString == null ? "" : limitString, null, null, null));

            final Map<String, Object> startAfter = startAfterTemp;
            final Map<String, Object> endBefore = endBeforeTemp;

            if (paginationField != null && CollectionUtils.isEmpty(orderings)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Cannot do pagination without specifying an ordering."
                ));
            }

            return Mono.just(query)
                    // Apply ordering, if provided.
                    .map(query1 -> {
                        Query q = query1;
                        final List<Object> startAfterValues = new ArrayList<>();
                        final List<Object> endBeforeValues = new ArrayList<>();
                        for (final String field : orderings) {
                            q = q.orderBy(
                                    field.replaceAll("^-", ""),
                                    field.startsWith("-") ? Query.Direction.DESCENDING : Query.Direction.ASCENDING
                            );
                            if (startAfter != null) {
                                startAfterValues.add(startAfter.get(field));
                            }
                            if (endBefore != null) {
                                endBeforeValues.add(endBefore.get(field));
                            }
                        }
                        if (PaginationField.NEXT.equals(paginationField) && !CollectionUtils.isEmpty(startAfter)) {
                            q = q.startAfter(startAfterValues.toArray());
                        } else if (PaginationField.PREV.equals(paginationField) && !CollectionUtils.isEmpty(endBefore)) {
                            q = q.endBefore(endBeforeValues.toArray());
                        }
                        return q;
                    })
                    // Apply where condition, if provided.
                    .flatMap(query1 -> {
                        if (!isWhereMethodUsed(properties)) {
                            return Mono.just(query1);
                        }

                        List<Object> conditionList = (List) properties.get(WHERE_CONDITIONAL_PROPERTY_INDEX).getValue();
                        requestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(WHERE_CONDITIONAL_PROPERTY_INDEX),
                                conditionList, null, null, null));

                        for(Object condition : conditionList) {
                            String path = ((Map<String, String>)condition).get("path");
                            String operatorString = ((Map<String, String>)condition).get("operator");
                            String value = ((Map<String, String>)condition).get("value");

                            /**
                             * - If all values in all where condition tuples are null, then isWhereMethodUsed(...)
                             *  function will indicate that where conditions are not used effectively and program
                             *  execution would return without reaching here.
                             */
                            if (StringUtils.isEmpty(path) || StringUtils.isEmpty(operatorString) || StringUtils.isEmpty(value)) {
                                return Mono.error(
                                        new AppsmithPluginException(
                                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                                "One of the where condition fields has been found empty. Please fill " +
                                                        "all the where condition fields and try again."
                                        )
                                );
                            }

                            try {
                                query1 = applyWhereConditional(query1, path, operatorString, value);
                            } catch (AppsmithPluginException e) {
                                return Mono.error(e);
                            }
                        }

                        return Mono.just(query1);
                    })
                    // Apply limit, always provided, since without it we can inadvertently end up processing too much data.
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
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
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
                        System.out.println(
                                Thread.currentThread().getName()
                                        + ": In the Firestore Plugin, got action execution result for get collection"
                        );
                        return Mono.just(result);
                    });
        }

        private boolean isWhereMethodUsed(List<Property> properties) {
            // Check if the where property list does not exist or is null
            if(properties.size() <= WHERE_CONDITIONAL_PROPERTY_INDEX || properties.get(WHERE_CONDITIONAL_PROPERTY_INDEX) == null
                    || CollectionUtils.isEmpty((List) properties.get(WHERE_CONDITIONAL_PROPERTY_INDEX).getValue())) {
                return false;
            }

            // Check if all values in the where property list are null.
            boolean allValuesNull = ((List) properties.get(WHERE_CONDITIONAL_PROPERTY_INDEX).getValue()).stream()
                    .allMatch(valueMap -> valueMap == null ||
                            ((Map) valueMap).entrySet().stream().allMatch(e -> ((Map.Entry) e).getValue() == null));

            if (allValuesNull) {
                return false;
            }

            return true;
        }

        private Mono<ActionExecutionResult> methodAddToCollection(CollectionReference collection, Map<String, Object> mapBody) {
            return Mono.justOrEmpty(collection.add(mapBody))
                    .flatMap(future -> {
                        try {
                            return Mono.just(future.get());
                        } catch (InterruptedException | ExecutionException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    e.getMessage()
                            ));
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
                        System.out.println(
                                Thread.currentThread().getName()
                                        + ": In the Firestore Plugin, got action execution result for add to collection"
                        );
                        return Mono.just(result);
                    });
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
                    for (final Map.Entry<String, Object> entry : documentSnapshot.getData().entrySet()) {
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
                        "path", documentReference.getPath()
                );

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

            } else if (isRoot) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to serialize object of type " + objResult.getClass().getName() + "."
                );

            }

            return objResult;
        }

        @Override
        public Mono<Firestore> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            final Set<String> errors = validateDatasource(datasourceConfiguration);
            if (!CollectionUtils.isEmpty(errors)) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        errors.iterator().next()));
            }

            final String projectId = authentication.getUsername();
            final String clientJson = authentication.getPassword();

            InputStream serviceAccount = new ByteArrayInputStream(clientJson.getBytes());

            return Mono
                    .fromSupplier(() -> {
                        GoogleCredentials credentials;
                        try {
                            credentials = GoogleCredentials.fromStream(serviceAccount);
                        } catch (IOException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Validation failed for field 'Service Account Credentials'. Please check the " +
                                            "value provided in the 'Service Account Credentials' field."
                            ));
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
        public void datasourceDestroy(Firestore connection) {
            // This is empty because there's no concept of destroying a Firestore connection here.
            // When the datasource is updated, the FirebaseApp instance will delete & re-create the app
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            Set<String> invalids = new HashSet<>();

            if (authentication == null) {
                invalids.add("Missing ProjectID and ClientJSON in datasource.");

            } else {
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing ProjectID in datasource.");
                }

                if (StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add("Missing ClientJSON in datasource.");
                }

            }

            if (StringUtils.isBlank(datasourceConfiguration.getUrl())) {
                invalids.add("Missing Firestore URL.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(connection -> new DatasourceTestResult())
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Firestore connection, DatasourceConfiguration datasourceConfiguration) {
            return Mono
                    .fromSupplier(() -> {
                        Iterable<CollectionReference> collectionReferences = connection.listCollections();

                        List<DatasourceStructure.Table> tables = StreamSupport.stream(collectionReferences.spliterator(), false)
                                .map(collectionReference -> {
                                    String id = collectionReference.getId();
                                    final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                                    return new DatasourceStructure.Table(
                                            DatasourceStructure.TableType.COLLECTION,
                                            null,
                                            id,
                                            new ArrayList<>(),
                                            new ArrayList<>(),
                                            templates
                                    );
                                })
                                .collect(Collectors.toList());

                        DatasourceStructure structure = new DatasourceStructure();
                        structure.setTables(tables);

                        return structure;
                    })
                    .subscribeOn(scheduler);
        }
    }
}
