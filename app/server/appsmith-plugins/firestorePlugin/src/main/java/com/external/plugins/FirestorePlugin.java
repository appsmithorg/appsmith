package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
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

    public FirestorePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class FirestorePluginExecutor implements PluginExecutor<Firestore> {

        private final Scheduler scheduler = Schedulers.elastic();

        @Override
        public Mono<ActionExecutionResult> execute(Firestore connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            final String path = actionConfiguration.getPath();

            if (StringUtils.isBlank(path)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Document/Collection path cannot be empty"
                ));
            }

            if (path.startsWith("/") || path.endsWith("/")) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Firestore paths should not begin or end with `/` character."
                ));
            }

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            final com.external.plugins.Method method = CollectionUtils.isEmpty(properties)
                    ? null
                    : com.external.plugins.Method.valueOf(properties.get(0).getValue());

            if (method == null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Missing Firestore method."
                ));
            }

            return Mono
                    .justOrEmpty(actionConfiguration.getBody())
                    .defaultIfEmpty("")
                    .flatMap(strBody -> {
                        if (StringUtils.isBlank(strBody)) {
                            return Mono.just(Collections.emptyMap());
                        }

                        try {
                            return Mono.just(objectMapper.readValue(strBody, HashMap.class));
                        } catch (IOException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    e.getMessage()
                            ));
                        }
                    })
                    .flatMap(mapBody -> {
                        if (mapBody.isEmpty() && method.isBodyNeeded()) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "The method " + method.toString() + " needs a non-empty body to work."
                            ));
                        }
                        return Mono.just((Map<String, Object>) mapBody);
                    })
                    .flatMap(mapBody -> {
                        if (method.isDocumentLevel()) {
                            return handleDocumentLevelMethod(connection, path, method, mapBody);
                        } else {
                            return handleCollectionLevelMethod(connection, path, method, properties, mapBody);
                        }
                    })
                    .subscribeOn(scheduler);
        }

        public Mono<ActionExecutionResult> handleDocumentLevelMethod(
                Firestore connection,
                String path,
                com.external.plugins.Method method,
                Map<String, Object> mapBody
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
                com.external.plugins.Method method,
                List<Property> properties,
                Map<String, Object> mapBody
        ) {
            final CollectionReference collection = connection.collection(path);

            if (method == Method.GET_COLLECTION) {
                return methodGetCollection(collection, properties);

            } else if (method == Method.ADD_TO_COLLECTION) {
                return methodAddToCollection(collection, mapBody);

            }

            return Mono.error(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Unsupported collection-level command: " + method
            ));
        }

        private Mono<ActionExecutionResult> methodGetCollection(CollectionReference query, List<Property> properties) {
            final String orderBy = properties.size() > 1 && properties.get(1) != null ? properties.get(1).getValue() : null;
            final int limit = properties.size() > 2 && properties.get(2) != null ? Integer.parseInt(properties.get(2).getValue()) : 10;
            final String queryFieldPath = properties.size() > 3 && properties.get(3) != null ? properties.get(3).getValue() : null;
            final Op operator = properties.size() > 4 && properties.get(4) != null ? Op.valueOf(properties.get(4).getValue()) : null;
            final String queryValue = properties.size() > 5 && properties.get(5) != null ? properties.get(5).getValue() : null;

            return Mono.just(query)
                    // Apply ordering, if provided.
                    .map(query1 -> StringUtils.isEmpty(orderBy) ? query1 : query1.orderBy(orderBy))
                    // Apply where condition, if provided.
                    .flatMap(query1 -> {
                        if (StringUtils.isEmpty(queryFieldPath) || operator == null || queryValue == null) {
                            return Mono.just(query1);
                        }

                        switch (operator) {
                            case LT:
                                return Mono.just(query1.whereLessThan(queryFieldPath, queryValue));
                            case LTE:
                                return Mono.just(query1.whereLessThanOrEqualTo(queryFieldPath, queryValue));
                            case EQ:
                                return Mono.just(query1.whereEqualTo(queryFieldPath, queryValue));
                            // TODO: NOT_EQ operator support is awaited in the next version of Firestore driver.
                            // case NOT_EQ:
                            //     return Mono.just(query1.whereNotEqualTo(queryFieldPath, queryValue));
                            case GT:
                                return Mono.just(query1.whereGreaterThan(queryFieldPath, queryValue));
                            case GTE:
                                return Mono.just(query1.whereGreaterThanOrEqualTo(queryFieldPath, queryValue));
                            case ARRAY_CONTAINS:
                                return Mono.just(query1.whereArrayContains(queryFieldPath, queryValue));
                            case ARRAY_CONTAINS_ANY:
                                try {
                                    return Mono.just(query1.whereArrayContainsAny(queryFieldPath, parseList(queryValue)));
                                } catch (IOException e) {
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_ERROR,
                                            "Unable to parse condition value as a JSON list."
                                    ));
                                }
                            case IN:
                                try {
                                    return Mono.just(query1.whereIn(queryFieldPath, parseList(queryValue)));
                                } catch (IOException e) {
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_ERROR,
                                            "Unable to parse condition value as a JSON list."
                                    ));
                                }
                                // TODO: NOT_IN operator support is awaited in the next version of Firestore driver.
                                // case NOT_IN:
                                //     return Mono.just(query1.whereNotIn(queryFieldPath, queryValue));
                            default:
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Unsupported operator for `where` condition " + operator.toString() + "."
                                ));
                        }
                    })
                    // Apply limit, always provided, since without it we can inadvertently end up processing too much data.
                    .map(query1 -> query1.limit(limit))
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
                DocumentSnapshot documentSnapshot = (DocumentSnapshot) objResult;
                Map<String, Object> resultMap = new HashMap<>();
                if (documentSnapshot.getData() != null) {
                    for (final Map.Entry<String, Object> entry : documentSnapshot.getData().entrySet()) {
                        resultMap.put(entry.getKey(), resultToMap(entry.getValue(), false));
                    }
                }
                return resultMap;

            } else if (objResult instanceof Map) {
                Map<String, Object> resultMap = (Map) objResult;
                for (final Map.Entry<String, Object> entry : resultMap.entrySet()) {
                    resultMap.put(entry.getKey(), resultToMap(entry.getValue(), false));
                }
                return resultMap;

            } else if (objResult instanceof QuerySnapshot) {
                QuerySnapshot querySnapshot = (QuerySnapshot) objResult;
                List<Map<String, Object>> documents = new ArrayList<>();
                for (QueryDocumentSnapshot documentSnapshot : querySnapshot.getDocuments()) {
                    final Map<String, Object> data = documentSnapshot.getData();
                    for (final Map.Entry<String, Object> entry : data.entrySet()) {
                        data.put(entry.getKey(), resultToMap(entry.getValue(), false));
                    }
                    documents.add(data);
                }
                return documents;

            } else if (objResult instanceof DocumentReference) {
                DocumentReference documentReference = (DocumentReference) objResult;
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("id", documentReference.getId());
                resultMap.put("path", documentReference.getPath());
                return resultMap;

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
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, errors.iterator().next()));
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
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    e.getMessage()
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

        private <T> List<T> parseList(String arrayJson) throws IOException {
            return (List<T>) objectMapper.readValue(arrayJson, ArrayList.class);
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
