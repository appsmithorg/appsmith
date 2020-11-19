package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
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
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
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

    private static final String CLIENT_JSON_FIELD = "clientJSON";
    private static final String PROJECT_ID_FIELD = "projectId";

    public FirestorePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class FirestorePluginExecutor implements PluginExecutor<Firestore> {

        private final Scheduler scheduler = Schedulers.newParallel("FirebaseThreads");

        @Override
        public Mono<ActionExecutionResult> execute(Firestore connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            final String path = actionConfiguration.getPath();

            if (path.startsWith("/") || path.endsWith("/")) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Firestore paths should not begin or end with `/` character."
                ));
            }

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            final com.external.plugins.Method method = properties.isEmpty()
                    ? null
                    : com.external.plugins.Method.valueOf(properties.get(0).getValue());

            if (method == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Invalid method."));
            }

            String strBody = actionConfiguration.getBody();
            Map<String, Object> mapBody = null;
            if (StringUtils.isNotBlank(actionConfiguration.getBody())) {
                try {
                    mapBody = objectMapper.readValue(strBody, HashMap.class);
                } catch (IOException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                }
            }

            if (mapBody == null && method.isBodyNeeded()) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "The method " + method.toString() + " needs a non-empty body to work."
                ));
            }

            if (method.isDocumentLevel()) {
                return handleDocumentLevelMethod(connection, path, method, mapBody);
            } else {
                return handleCollectionLevelMethod(connection, path, method, properties);
            }
        }

        public Mono<ActionExecutionResult> handleDocumentLevelMethod(
                Firestore connection,
                String path,
                com.external.plugins.Method method,
                Map<String, Object> mapBody
        ) {
            Object objResult;
            try {
                DocumentReference document = connection.document(path);
                Method operationMethod = null;
                final String methodName = method.toString().split("_")[0].toLowerCase();

                switch (method) {
                    case GET_DOCUMENT:
                    case DELETE_DOCUMENT:
                        operationMethod = DocumentReference.class.getMethod(methodName);
                        break;
                    case SET_DOCUMENT:
                    case CREATE_DOCUMENT:
                    case UPDATE_DOCUMENT:
                        operationMethod = DocumentReference.class.getMethod(methodName, Map.class);
                        break;
                }

                ApiFuture<Object> objFuture;
                if (method.isBodyNeeded()) {
                    objFuture = (ApiFuture<Object>) operationMethod.invoke(document, mapBody);
                } else {
                    objFuture = (ApiFuture<Object>) operationMethod.invoke(document);
                }
                objResult = objFuture.get();

            } catch (NoSuchMethodException |
                    IllegalAccessException |
                    InvocationTargetException |
                    InterruptedException |
                    ExecutionException e) {
                e.printStackTrace();
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));

            }

            ActionExecutionResult result = new ActionExecutionResult();
            result.setIsExecutionSuccess(true);
            if (objResult != null) {
                try {
                    result.setBody(resultToMap(objResult));
                } catch (AppsmithPluginException e) {
                    return Mono.error(e);
                }
            }

            return Mono.just(result);
        }

        public Mono<ActionExecutionResult> handleCollectionLevelMethod(
                Firestore connection,
                String path,
                com.external.plugins.Method method,
                List<Property> properties
        ) {
            final String orderBy = properties.size() > 1 && properties.get(1) != null ? properties.get(1).getValue() : null;
            final int limit = properties.size() > 2 && properties.get(2) != null ? Integer.parseInt(properties.get(2).getValue()) : 10;
            final String queryFieldPath = properties.size() > 3 && properties.get(3) != null ? properties.get(3).getValue() : null;
            final Op operator = properties.size() > 4 && properties.get(4) != null ? Op.valueOf(properties.get(4).getValue()) : null;
            final String queryValue = properties.size() > 5 && properties.get(5) != null ? properties.get(5).getValue() : null;

            Query query = connection.collection(path);
            if (StringUtils.isNotEmpty(orderBy)) {
                query = query.orderBy(orderBy);
            }

            if (StringUtils.isNotEmpty(queryFieldPath) && operator != null && queryValue != null) {
                switch (operator) {
                    case LT:
                        query = query.whereLessThan(queryFieldPath, queryValue);
                        break;
                    case LTE:
                        query = query.whereLessThanOrEqualTo(queryFieldPath, queryValue);
                        break;
                    case EQ:
                        query = query.whereEqualTo(queryFieldPath, queryValue);
                        break;
                    // case NOT_EQ:
                    //     query = query.whereNotEqualTo(queryFieldPath, queryValue);
                    //     break;
                    case GT:
                        query = query.whereGreaterThan(queryFieldPath, queryValue);
                        break;
                    case GTE:
                        query = query.whereGreaterThanOrEqualTo(queryFieldPath, queryValue);
                        break;
                    case ARRAY_CONTAINS:
                        query = query.whereArrayContains(queryFieldPath, queryValue);
                        break;
                    case ARRAY_CONTAINS_ANY:
                        try {
                            query = query.whereArrayContainsAny(queryFieldPath, parseList(queryValue));
                        } catch (IOException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Unable to parse condition value as a JSON list."
                            ));
                        }
                        break;
                    case IN:
                        try {
                            query = query.whereIn(queryFieldPath, parseList(queryValue));
                        } catch (IOException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Unable to parse condition value as a JSON list."
                            ));
                        }
                        break;
                    // case NOT_IN:
                    //     query = query.whereNotIn(queryFieldPath, queryValue);
                    //     break;
                }
            }

            query = query.limit(limit);

            return Mono.just(query)
                    .flatMap(query1 -> {
                        switch (method) {
                            case GET_COLLECTION:
                                return Mono.fromSupplier(query1::get);
                            default:
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Unknown collection method: " + method.toString()
                                ));
                        }
                    })
                    .flatMap(resultFuture -> Mono
                            .fromSupplier(() -> {
                                try {
                                    return resultFuture.get();
                                } catch (InterruptedException | ExecutionException e) {
                                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                                }
                            }))
                    .flatMap(objResult1 -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        try {
                            result.setBody(resultToMap(objResult1));
                        } catch (AppsmithPluginException e) {
                            return Mono.error(e);
                        }
                        result.setIsExecutionSuccess(true);
                        return Mono.just(result);
                    })
                    .subscribeOn(scheduler);
        }

        private Object resultToMap(Object objResult) throws AppsmithPluginException {
            if (objResult instanceof WriteResult) {
                WriteResult writeResult = (WriteResult) objResult;
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("lastUpdateTime", writeResult.getUpdateTime());
                return resultMap;

            } else if (objResult instanceof DocumentSnapshot) {
                DocumentSnapshot documentSnapshot = (DocumentSnapshot) objResult;
                Map<String, Object> resultMap = new HashMap<>();
                if (documentSnapshot.getData() != null) {
                    resultMap = documentSnapshot.getData();
                }
                return resultMap;

            } else if (objResult instanceof QuerySnapshot) {
                QuerySnapshot querySnapshot = (QuerySnapshot) objResult;
                List<Map<String, Object>> documents = new ArrayList<>();
                for (QueryDocumentSnapshot documentSnapshot : querySnapshot.getDocuments()) {
                    documents.add(documentSnapshot.getData());
                }
                return documents;

            } else {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to serialize object of type " + objResult.getClass().getName()
                );

            }
        }

        @Override
        public Mono<Firestore> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            final AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

            if (authentication == null || StringUtils.isEmpty(authentication.getUsername()) || StringUtils.isEmpty(authentication.getPassword())) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Invalid datasource fields"));
            }

            final String projectId = authentication.getUsername();
            final String clientJson = authentication.getPassword();

            InputStream serviceAccount = new ByteArrayInputStream(clientJson.getBytes());
            GoogleCredentials credentials;

            try {
                credentials = GoogleCredentials.fromStream(serviceAccount);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setDatabaseUrl(datasourceConfiguration.getUrl())
                        .setProjectId(projectId)
                        .setCredentials(credentials)
                        .build();

                FirebaseApp firebaseApp;
                try {
                    firebaseApp = FirebaseApp.getInstance(projectId);
                } catch (IllegalStateException e) {
                    firebaseApp = FirebaseApp.initializeApp(options, projectId);
                }

                Firestore db = FirestoreClient.getFirestore(firebaseApp);
                return Mono.just(db);
            } catch (IOException e) {
                return Mono.error(new Exception("Unable to initialize Firestore. Cause: " + e.getMessage()));
            }
        }

        @Override
        public void datasourceDestroy(Firestore connection) {
            // This is empty because there's no concept of destroying a Firestore connection here.
            // When the datasource is updated, the FirebaseApp instance will delete & re-create the app
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            final AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

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
            return objectMapper.readValue(arrayJson, ArrayList.class);
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(connection -> new DatasourceTestResult())
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Firestore connection, DatasourceConfiguration datasourceConfiguration) {
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

            return Mono.just(structure);
        }
    }
}
