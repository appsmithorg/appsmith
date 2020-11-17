package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
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
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

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
            com.external.plugins.Method method = null;

            for (Property formData : properties) {
                if ("method".equals(formData.getKey())) {
                    method = com.external.plugins.Method.valueOf(formData.getValue());
                }
            }

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

            if (strBody == null
                    && (
                    method == com.external.plugins.Method.SET_DOCUMENT
                            || method == com.external.plugins.Method.CREATE_DOCUMENT
                            || method == com.external.plugins.Method.UPDATE_DOCUMENT
            )
            ) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "The method " + method.toString() + " needs a non-empty body to work."
                ));
            }

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
                if (mapBody == null) {
                    objFuture = (ApiFuture<Object>) operationMethod.invoke(document);
                } else {
                    objFuture = (ApiFuture<Object>) operationMethod.invoke(document, mapBody);
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
                Map resultMap = resultToMap(objResult);
                result.setBody(resultMap);
            }

            return Mono.just(result);
        }

        private Map resultToMap(Object objResult) {
            Map<String, Object> resultMap = new HashMap<>();
            if (objResult instanceof WriteResult) {
                WriteResult writeResult = (WriteResult) objResult;
                resultMap.put("lastUpdateTime", writeResult.getUpdateTime());
            } else if (objResult instanceof DocumentSnapshot) {
                DocumentSnapshot documentSnapshot = (DocumentSnapshot) objResult;
                if (documentSnapshot.getData() != null) {
                    resultMap = documentSnapshot.getData();
                }
            }
            return resultMap;
        }

        @Override
        public Mono<Firestore> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            String clientJson = null;
            String projectId = null;
            for (Property property : datasourceConfiguration.getProperties()) {
                String key = property.getKey();
                if (CLIENT_JSON_FIELD.equals(key)) {
                    clientJson = property.getValue();
                }
                if (PROJECT_ID_FIELD.equals(key)) {
                    projectId = property.getValue();
                }
            }

            if (StringUtils.isEmpty(clientJson) || StringUtils.isEmpty(projectId)) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Invalid datasource fields"));
            }

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
            Set<String> invalids = new HashSet<>();
            if (datasourceConfiguration.getProperties() == null || datasourceConfiguration.getProperties().isEmpty()) {
                invalids.add("Missing datasource configuration properties");
                return invalids;
            }
            String clientJson = "";
            String projectId = "";

            for (Property property : datasourceConfiguration.getProperties()) {
                String key = property.getKey();
                if (CLIENT_JSON_FIELD.equals(key)) {
                    clientJson = property.getValue();
                }
                if (PROJECT_ID_FIELD.equals(key)) {
                    projectId = property.getValue();
                }
            }

            if (StringUtils.isBlank(clientJson)) {
                invalids.add("Missing client json. Please generate this from Firebase Console");
            }

            if (StringUtils.isBlank(projectId)) {
                invalids.add("Missing projectId");
            }

            if (StringUtils.isBlank(datasourceConfiguration.getUrl())) {
                invalids.add("Missing database URL");
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
