package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.arangodb.ArangoCursor;
import com.arangodb.ArangoDB.Builder;
import com.arangodb.ArangoDBException;
import com.arangodb.ArangoDatabase;
import com.arangodb.Protocol;
import com.arangodb.entity.CollectionEntity;
import com.arangodb.model.CollectionsReadOptions;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.util.StringUtils;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.MATCH_QUOTED_WORDS_REGEX;
import static com.external.utils.SSLUtils.isCaCertificateAvailable;
import static com.external.utils.SSLUtils.setSSLContext;
import static com.external.utils.SSLUtils.setSSLParam;
import static com.external.utils.StructureUtils.generateTemplatesAndStructureForACollection;
import static com.external.utils.StructureUtils.getOneDocumentQuery;

public class ArangoDBPlugin extends BasePlugin {

    private static long DEFAULT_PORT = 8529L;
    private static String WRITES_EXECUTED_KEY = "writesExecuted";
    private static String WRITES_IGNORED_KEY = "writesIgnored";
    private static String RETURN_KEY = "return";

    public ArangoDBPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class ArangoDBPluginExecutor implements PluginExecutor<ArangoDatabase> {

        private final Scheduler scheduler = Schedulers.elastic();

        @Override
        public Mono<ActionExecutionResult> execute(ArangoDatabase db,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            if (!isConnectionValid(db)) {
                return Mono.error(new StaleConnectionException());
            }

            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                    query, null, null, null));
            if (StringUtils.isNullOrEmpty(query)) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Missing required parameter: Query."
                        )
                );
            }

            return Mono.fromCallable(() -> {
                System.out.println(Thread.currentThread().getName() + ": In the ArangoDBPlugin, got action execution result");
                ArangoCursor<Map> cursor = db.query(query, null, null, Map.class);
                ActionExecutionResult result = new ActionExecutionResult();
                result.setIsExecutionSuccess(true);
                List<Map> docList = new ArrayList<>();

                if (isUpdateQuery(query)) {
                    Map<String, Long> updateCount = new HashMap<>();
                    updateCount.put(WRITES_EXECUTED_KEY, cursor.getStats().getWritesExecuted());
                    updateCount.put(WRITES_IGNORED_KEY, cursor.getStats().getWritesIgnored());
                    docList.add(updateCount);
                }
                else {
                    docList.addAll(cursor.asListRemaining());
                }

                result.setBody(objectMapper.valueToTree(docList));

                return result;
            })
                    .onErrorResume(error -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned back to the server
                    .flatMap(actionExecutionResult -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        actionExecutionResult.setRequest(request);
                        return Mono.just(actionExecutionResult);
                    })
                    .subscribeOn(scheduler);
        }

        /**
         * - In ArangoDB query language, any non-update query is indicated by the use of keyword RETURN.
         * - This method checks if the query provided by user has the RETURN keyword or not. To do so, it first
         * removes any string present inside double or single quotes (to remove any usage of the keyword as a value).
         * It then matches the remaining words with the keyword RETURN.
         * - Quoting from ArangoDB doc:
         * ```
         * An AQL query must either return a result (indicated by usage of the RETURN keyword) or execute a
         * data-modification operation
         * ```
         * ref: https://www.arangodb.com/docs/stable/aql/fundamentals-syntax.html
         */
        private boolean isUpdateQuery(String query) {
            String queryKeyWordsOnly = query.replaceAll(MATCH_QUOTED_WORDS_REGEX, "");
            return !Arrays.stream(queryKeyWordsOnly.split("\\s"))
                    .anyMatch(word -> RETURN_KEY.equals(word.trim().toLowerCase()));
        }

        /**
         * - ArangoDatabase object does not seem to provide any API to check if connection object is valid, hence
         * adding only null check for now.
         */
        private boolean isConnectionValid(ArangoDatabase db) {
            if (db == null) {
                return false;
            }

            return true;
        }


        @Override
        public Mono<ArangoDatabase> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<ArangoDatabase>) Mono.fromCallable(() -> {

                List<Endpoint> nonEmptyEndpoints = datasourceConfiguration.getEndpoints().stream()
                        .filter(endpoint -> isNonEmptyEndpoint(endpoint))
                        .collect(Collectors.toList());

                DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
                Builder dbBuilder = getBasicBuilder(auth);
                nonEmptyEndpoints.stream()
                        .forEach(endpoint -> {
                            String host = endpoint.getHost();
                            int port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT);
                            dbBuilder.host(host, port);
                        });

                /**
                 * - datasource.connection, datasource.connection.ssl, datasource.connection.ssl.authType objects
                 * are never expected to be null because form.json always assigns a default value to authType object.
                 */
                SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
                try {
                    setSSLParam(dbBuilder, sslAuthType);
                } catch (AppsmithPluginException e) {
                    return Mono.error(e);
                }

                try {
                    setSSLContext(dbBuilder, datasourceConfiguration);
                } catch (AppsmithPluginException e) {
                    return Mono.error(e);
                }

                String dbName = auth.getDatabaseName();

                /**
                 * - This instance is thread safe as ArangoDatabase has in-built connection pooling.
                 * - src: https://www.arangodb.com/docs/stable/drivers/java-reference-setup.html
                 */
                return Mono.just(dbBuilder.build().db(dbName));
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        /**
         * - Builder properties are explained here:
         * https://www.arangodb.com/docs/stable/drivers/java-reference-setup.html
         */
        private Builder getBasicBuilder(DBAuth auth) {
            String username = auth.getUsername();
            String password = auth.getPassword();
            Builder dbBuilder = new Builder()
                    .maxConnections(5)
                    .user(username)
                    .password(password)
                    .useProtocol(Protocol.HTTP_VPACK);

            return dbBuilder;
        }

        private boolean isNonEmptyEndpoint(Endpoint endpoint) {
            if (endpoint != null && StringUtils.isNotNullOrEmpty(endpoint.getHost())) {
                return true;
            }

            return false;
        }

        private boolean isAuthenticationMissing(DBAuth auth) {
            if (auth == null
                    || StringUtils.isNullOrEmpty(auth.getUsername())
                    || StringUtils.isNullOrEmpty(auth.getPassword())
                    || StringUtils.isNullOrEmpty(auth.getDatabaseName())) {
                return true;
            }

            return false;
        }

        @Override
        public void datasourceDestroy(ArangoDatabase db) {
            db.arango().shutdown();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isAuthenticationMissing(auth)) {
               invalids.add(
                       "Could not find required authentication info. At least one of 'Username', 'Password', " +
                               "'Database Name' fields is missing. Please edit the 'Username', 'Password' and " +
                               "'Database Name' fields to provide authentication info."
               );
            }

            if (!isEndpointAvailable(datasourceConfiguration.getEndpoints())) {
                invalids.add(
                        "Could not find host address. Please edit the 'Host Address' field to provide the desired " +
                                "endpoint."
                );
            }

            SSLDetails.CACertificateType caCertificateType = datasourceConfiguration.getConnection().getSsl()
                    .getCaCertificateType();
            if (!SSLDetails.CACertificateType.NONE.equals(caCertificateType)
                    && !isCaCertificateAvailable(datasourceConfiguration)) {
                    invalids.add("Could not find CA certificate. Please provide a CA certificate.");
            }

            return invalids;
        }

        /**
         * - Check if at least one non-null / non-empty endpoint is available.
         */
        private boolean isEndpointAvailable(List<Endpoint> endpoints) {
            // Check if the list of endpoints is null or empty.
            if (CollectionUtils.isEmpty(endpoints)) {
                return false;
            }

            List<Endpoint> nonEmptyEndpoints = endpoints.stream()
                    .filter(endpoint -> isNonEmptyEndpoint(endpoint))
                    .collect(Collectors.toList());

            // Check if at least one endpoint in the list is non-null and non-empty.
            if (CollectionUtils.isEmpty(nonEmptyEndpoints)) {
                return false;
            }

            return true;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(db -> {
                        db.getVersion();

                        if (db != null) {
                            db.arango().shutdown();
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> {
                        log.error("Error when testing ArangoDB datasource.", error);
                        return Mono.just(new DatasourceTestResult(error.getMessage()));
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(ArangoDatabase db, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            List<DatasourceStructure.Table> tables = new ArrayList<>();
            structure.setTables(tables);

            CollectionsReadOptions options = new CollectionsReadOptions();
            options.excludeSystem(true);
            Collection<CollectionEntity> collections;
            try {
                collections = db.getCollections(options);
            } catch (ArangoDBException e) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                "Appsmith server has failed to fetch list of collections from database. Please check " +
                                        "if the database credentials are valid and/or you have the required " +
                                        "permissions."
                        )
                );
            }

            return Flux.fromIterable(collections)
                    .filter(collectionEntity -> !collectionEntity.getIsSystem())
                    .flatMap(collectionEntity -> {
                        final ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
                        final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                        final String collectionName = collectionEntity.getName();
                        tables.add(
                                new DatasourceStructure.Table(
                                        DatasourceStructure.TableType.COLLECTION,
                                        null,
                                        collectionName,
                                        columns,
                                        new ArrayList<>(),
                                        templates
                                )
                        );

                        ArangoCursor<Map> cursor = db.query(getOneDocumentQuery(collectionName), null, null, Map.class);
                        Map document = new HashMap();
                        List<Map> docList = cursor.asListRemaining();
                        if (!CollectionUtils.isEmpty(docList)) {
                            document = docList.get(0);
                        }

                        return Mono.zip(
                                Mono.just(columns),
                                Mono.just(templates),
                                Mono.just(collectionName),
                                Mono.just(document)
                        );
                    })
                    .flatMap(tuple -> {
                        final ArrayList<DatasourceStructure.Column> columns = tuple.getT1();
                        final ArrayList<DatasourceStructure.Template> templates = tuple.getT2();
                        String collectionName = tuple.getT3();
                        Map document = tuple.getT4();

                        generateTemplatesAndStructureForACollection(collectionName, document, columns, templates);

                        return Mono.just(structure);
                    })
                    .collectList()
                    .thenReturn(structure)
                    .subscribeOn(scheduler);
        }
    }
}
