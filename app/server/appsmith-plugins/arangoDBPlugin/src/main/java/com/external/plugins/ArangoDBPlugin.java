package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.arangodb.ArangoCursor;
import com.arangodb.ArangoDB.Builder;
import com.arangodb.ArangoDBException;
import com.arangodb.ArangoDatabase;
import com.arangodb.Protocol;
import com.arangodb.entity.CollectionEntity;
import com.arangodb.model.CollectionsReadOptions;
import com.external.plugins.exceptions.ArangoDBErrorMessages;
import com.external.plugins.exceptions.ArangoDBPluginError;
import com.external.utils.ArangoDBErrorUtils;
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

import java.time.Duration;
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
import static com.external.plugins.exceptions.ArangoDBErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.external.plugins.exceptions.ArangoDBErrorMessages.DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG;
import static com.external.utils.SSLUtils.isCaCertificateAvailable;
import static com.external.utils.SSLUtils.setSSLContext;
import static com.external.utils.SSLUtils.setSSLParam;
import static com.external.utils.StructureUtils.generateTemplatesAndStructureForACollection;
import static com.external.utils.StructureUtils.getOneDocumentQuery;
import static org.apache.commons.lang3.StringUtils.isBlank;

public class ArangoDBPlugin extends BasePlugin {

    private static long DEFAULT_PORT = 8529L;
    private static String WRITES_EXECUTED_KEY = "writesExecuted";
    private static String WRITES_IGNORED_KEY = "writesIgnored";
    private static String RETURN_KEY = "return";
    public static final int TEST_DATASOURCE_TIMEOUT_SECONDS = 15;

    public ArangoDBPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class ArangoDBPluginExecutor implements PluginExecutor<ArangoDatabase> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        public static AppsmithPluginErrorUtils arangoDBErrorUtils = ArangoDBErrorUtils.getInstance();

        @Override
        public Mono<ActionExecutionResult> execute(
                ArangoDatabase db,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage = Thread.currentThread().getName() + ": execute() called for ArangoDB plugin.";
            log.debug(printMessage);
            if (!isConnectionValid(db)) {
                return Mono.error(new StaleConnectionException(CONNECTION_INVALID_ERROR_MSG));
            }

            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));
            if (StringUtils.isNullOrEmpty(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        ArangoDBErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

            return Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName()
                                + ": got action execution result from ArangoDB plugin.");
                        ArangoCursor<Map> cursor = db.query(query, null, null, Map.class);
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(true);
                        List<Map> docList = new ArrayList<>();

                        if (isUpdateQuery(query)) {
                            Map<String, Long> updateCount = new HashMap<>();
                            updateCount.put(
                                    WRITES_EXECUTED_KEY, cursor.getStats().getWritesExecuted());
                            updateCount.put(
                                    WRITES_IGNORED_KEY, cursor.getStats().getWritesIgnored());
                            docList.add(updateCount);
                        } else {
                            docList.addAll(cursor.asListRemaining());
                        }

                        result.setBody(objectMapper.valueToTree(docList));

                        return result;
                    })
                    .onErrorResume(error -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    ArangoDBPluginError.QUERY_EXECUTION_FAILED,
                                    ArangoDBErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    error);
                        }
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
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

            String printMessage = Thread.currentThread().getName() + ": datasourceCreate() called for ArangoDB plugin.";
            log.debug(printMessage);
            return (Mono<ArangoDatabase>) Mono.fromCallable(() -> {
                        log.debug(
                                Thread.currentThread().getName() + ": inside schdeuled thread from ArangoDB plugin.");
                        List<Endpoint> nonEmptyEndpoints = datasourceConfiguration.getEndpoints().stream()
                                .filter(endpoint -> isNonEmptyEndpoint(endpoint))
                                .collect(Collectors.toList());

                        DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
                        Builder dbBuilder = getBasicBuilder(auth);
                        nonEmptyEndpoints.stream().forEach(endpoint -> {
                            String host = endpoint.getHost();
                            int port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT);
                            dbBuilder.host(host, port);
                        });

                        /**
                         * - datasource.connection, datasource.connection.ssl, datasource.connection.ssl.authType objects
                         * are never expected to be null because form.json always assigns a default value to authType object.
                         */
                        SSLDetails.AuthType sslAuthType =
                                datasourceConfiguration.getConnection().getSsl().getAuthType();
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
            String printMessage =
                    Thread.currentThread().getName() + ": datasourceDestroy() called for ArangoDB plugin.";
            log.debug(printMessage);
            db.arango().shutdown();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for ArangoDB plugin.";
            log.debug(printMessage);
            Set<String> invalids = new HashSet<>();

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isAuthenticationMissing(auth)) {
                invalids.add(ArangoDBErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG);
            }

            if (!isEndpointAvailable(datasourceConfiguration.getEndpoints())) {
                invalids.add(ArangoDBErrorMessages.DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG);
            }

            SSLDetails.CACertificateType caCertificateType =
                    datasourceConfiguration.getConnection().getSsl().getCaCertificateType();
            if (!SSLDetails.CACertificateType.NONE.equals(caCertificateType)
                    && !isCaCertificateAvailable(datasourceConfiguration)) {
                invalids.add(ArangoDBErrorMessages.DS_CA_CERT_NOT_FOUND_ERROR_MSG);
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
        public Mono<DatasourceTestResult> testDatasource(ArangoDatabase connection) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for ArangoDB plugin.";
            log.debug(printMessage);
            return Mono.fromCallable(() -> {
                        connection.getVersion();
                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> {
                        log.debug("Error when testing ArangoDB datasource.");
                        error.printStackTrace();
                        return Mono.just(new DatasourceTestResult(arangoDBErrorUtils.getReadableError(error)));
                    })
                    .timeout(
                            Duration.ofSeconds(TEST_DATASOURCE_TIMEOUT_SECONDS),
                            Mono.just(new DatasourceTestResult(DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG)));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                ArangoDatabase db, DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": getStructure() called for ArangoDB plugin.";
            log.debug(printMessage);
            final DatasourceStructure structure = new DatasourceStructure();
            List<DatasourceStructure.Table> tables = new ArrayList<>();
            structure.setTables(tables);

            CollectionsReadOptions options = new CollectionsReadOptions();
            options.excludeSystem(true);
            Collection<CollectionEntity> collections;
            try {
                collections = db.getCollections(options);
            } catch (ArangoDBException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                        ArangoDBErrorMessages.GET_STRUCTURE_ERROR_MSG,
                        e.getErrorMessage()));
            }

            return Flux.fromIterable(collections)
                    .filter(collectionEntity -> !collectionEntity.getIsSystem())
                    .flatMap(collectionEntity -> {
                        log.debug(Thread.currentThread().getName()
                                + ": got collectionEntity result from ArangoDB plugin.");
                        final ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
                        final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                        final String collectionName = collectionEntity.getName();
                        tables.add(new DatasourceStructure.Table(
                                DatasourceStructure.TableType.COLLECTION,
                                null,
                                collectionName,
                                columns,
                                new ArrayList<>(),
                                templates));

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
                                Mono.just(document));
                    })
                    .flatMap(tuple -> {
                        log.debug(Thread.currentThread().getName()
                                + ": generating templates and structure in ArangoDB plugin.");
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

        @Override
        public Mono<String> getEndpointIdentifierForRateLimit(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName()
                    + ": getEndpointIdentifierForRateLimit() called for ArangoDB plugin.";
            log.debug(printMessage);
            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            String identifier = "";
            // When hostname and port both are available, both will be used as identifier
            // When port is not present, default port along with hostname will be used
            // This ensures rate limiting will only be applied if hostname is present
            if (endpoints.size() > 0) {
                String hostName = endpoints.get(0).getHost();
                Long port = endpoints.get(0).getPort();
                if (!isBlank(hostName)) {
                    identifier = hostName + "_" + ObjectUtils.defaultIfNull(port, DEFAULT_PORT);
                }
            }
            return Mono.just(identifier);
        }
    }
}
