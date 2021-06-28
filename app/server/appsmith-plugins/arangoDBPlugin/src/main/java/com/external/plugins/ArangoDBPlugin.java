package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.arangodb.ArangoCursor;
import com.arangodb.ArangoDB;
import com.arangodb.ArangoDBException;
import com.arangodb.ArangoDatabase;
import com.arangodb.Protocol;
import com.arangodb.entity.CollectionEntity;
import com.arangodb.model.CollectionSchema;
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
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ArangoDBPlugin extends BasePlugin {

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

            return Mono.fromCallable(() -> {

                String query = actionConfiguration.getBody();
                if (query == null) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required parameter: Query."));
                }

                List<Map> docList = new LinkedList<>();
                try {
                    ArangoCursor<Map> cursor = db.query(query, null, null, Map.class);
                    docList.addAll(cursor.asListRemaining());
                } catch (ArangoDBException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                }
                ActionExecutionResult result = new ActionExecutionResult();
                result.setBody(objectMapper.valueToTree(docList));
                result.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the ArangoDBPlugin, got action execution result");
                return Mono.just(result);
            })
                    .flatMap(obj -> obj)
                    .map(obj -> {
                        ActionExecutionResult result = (ActionExecutionResult) obj;
                        return result;
                    })
                    .subscribeOn(scheduler);
        }


        @Override
        public Mono<ArangoDatabase> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<ArangoDatabase>) Mono.fromCallable(() -> {
                if (datasourceConfiguration.getEndpoints().isEmpty()) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "No endpoint(s) configured"));
                }

                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                Integer port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), 8529);
                String host = endpoint.getHost();

                String username = null;
                String password = null;
                String dbName = null;
                DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
                if (auth != null) {
                    username = auth.getUsername();
                    password = auth.getPassword();
                    dbName = auth.getDatabaseName();
                }

                ArangoDB arangoDB = new ArangoDB.Builder()
                        .host(host, port)
                        .user(username)
                        .password(password)
                        .useSsl(false)
                        .useProtocol(Protocol.HTTP_VPACK)
                        .build();

                ArangoDatabase db = arangoDB.db(dbName);
                return Mono.just(db);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(ArangoDatabase db) {
            db.arango().shutdown();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("No endpoint provided. Please provide a host:port where ArangoDB is reachable.");
            } else {
                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                if (StringUtils.isNullOrEmpty(endpoint.getHost())) {
                    invalids.add("Missing host for endpoint");
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .flatMap(arangoDB -> Mono.zip(
                            Mono.just(arangoDB),
                            Mono.from(Mono.just(arangoDB.getVersion()))
                    ))
                    .doOnSuccess(tuple -> {
                        ArangoDatabase db = tuple.getT1();

                        if (db != null) {
                            db.arango().shutdown();
                        }
                    })
                    .then(Mono.just(new DatasourceTestResult()))
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
            Collection<CollectionEntity> collections = db.getCollections(options);

            return Flux.fromIterable(collections)
                    .filter(collectionEntity -> !collectionEntity.getIsSystem())
                    .flatMap(collectionEntity -> {
                        final ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
                        final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                        final String name = collectionEntity.getName();
                        tables.add(new DatasourceStructure.Table(
                                DatasourceStructure.TableType.COLLECTION,
                                name,
                                columns,
                                new ArrayList<>(),
                                templates
                        ));
                        CollectionSchema schema = collectionEntity.getSchema();
                        if (schema != null) {
                            String rule = schema.getRule();
                        }

                        return Mono.just(structure);
                    })
                    .collectList()
                    .thenReturn(structure)
                    .subscribeOn(scheduler);
        }
    }
}
