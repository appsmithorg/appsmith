package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

public class FirestorePlugin extends BasePlugin {

    private static final String SERVICE_ACCOUNT_CREDENTIALS = "";

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

            List<Property> formDataList = actionConfiguration.getBodyFormData();
            String method = "";
            String collection = "";
            String documentKey = "";

            for (Property formData : formDataList) {
                if (!StringUtils.isBlank(formData.getKey())) {
                    switch (formData.getKey()) {
                        case "method":
                            method = formData.getValue().toLowerCase();
                            break;
                        case "collection":
                            collection = formData.getValue();
                            break;
                        case "documentKey":
                            documentKey = formData.getValue();
                            break;
                        default:
                            break;
                    }
                }
            }

            String strBody = actionConfiguration.getBody();
            HashMap mapBody = null;
            if (actionConfiguration.getBody() != null) {
                try {
                    mapBody = objectMapper.readValue(strBody, HashMap.class);
                } catch (IOException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                }
            }


            ApiFuture<Object> objFuture;
            Object objResult = null;
            try {
                DocumentReference docRef = connection.collection(collection).document(documentKey);

                DocumentReference document = connection.collection(collection).document(documentKey);
                Method operationMethod = null;
                switch (method) {
                    case "get":
                    case "delete":
                        operationMethod = DocumentReference.class.getMethod(method);
                        break;
                    case "set":
                    case "create":
                    case "update":
                        operationMethod = DocumentReference.class.getMethod(method, Map.class);
                        break;
                    default:
                        break;
                }

                if (operationMethod == null) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported operation: " + method));
                }

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
            }

            ActionExecutionResult result = new ActionExecutionResult();
            result.setIsExecutionSuccess(true);
            if (objResult != null) {
                result.setBody(resultToMap(objResult));
            }

            return Mono.just(result);
        }

        private Map resultToMap(Object objResult) {
            Map<String, Object> resultMap = new HashMap<String, Object>();
            if (objResult instanceof WriteResult) {
                WriteResult writeResult = (WriteResult) objResult;
                resultMap.put("lastUpdateTime", writeResult.getUpdateTime());
            } else if (objResult instanceof DocumentSnapshot) {
                DocumentSnapshot documentSnapshot = (DocumentSnapshot) objResult;
                resultMap = documentSnapshot.getData();
            }
            return resultMap;
        }
        @Override
        public Mono<Firestore> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            InputStream serviceAccount = new ByteArrayInputStream(SERVICE_ACCOUNT_CREDENTIALS.getBytes());
            GoogleCredentials credentials;
            Firestore db;
            try {
                credentials = GoogleCredentials.fromStream(serviceAccount);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                FirebaseApp.initializeApp(options);

                db = FirestoreClient.getFirestore();
                return Mono.just(db);
            } catch (IOException e) {
                e.printStackTrace();
            }
            return Mono.error(new Exception("Unable to initialize Firestore"));
        }

        @Override
        public void datasourceDestroy(Firestore connection) {

        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}
