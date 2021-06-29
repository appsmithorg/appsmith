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

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Base64;
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
                int port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), 8529L);
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

                // Base64 encoded CA certificate
                String encodedCA = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURHVENDQWdHZ0F3SUJBZ0lSQVBMOUF0WjlWRVlxR0NKWTVabm41YlF3RFFZSktvWklodmNOQVFFTEJRQXcKSmpFUk1BOEdBMVVFQ2hNSVFYSmhibWR2UkVJeEVUQVBCZ05WQkFNVENFRnlZVzVuYjBSQ01CNFhEVEl4TURZeQpPREE0TXpVME5Wb1hEVEkyTURZeU56QTRNelUwTlZvd0pqRVJNQThHQTFVRUNoTUlRWEpoYm1kdlJFSXhFVEFQCkJnTlZCQU1UQ0VGeVlXNW5iMFJDTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUEKdTNaK0FaeEFCcVE4emd5NTFFTzlKdGExV3pIcDhMZEsvWDZtamNuRHN4Y1pCTDZUNlNFVlQycHVqK1VMZ1JHSgp1WDN3KzBJalVSSzNsL0pkWDJDNFlPc0JJSkJyMXNpT21wQVVPb2J3YTU4VWN5WXp1bi9SMVhzQmNPeGdJUHY1CkJtcnV5aWM2ckJRMlNocFVVcmN4NXd4ekhpc1NxUjZBbmpvdEJFUFZXdkdvWGhLc1VQVVU4WTZ6cDVxck9NNFUKeERTTlpCWi9XMXY2bThxMVg3Mzd1TDBDcjkwK2lqbUlJL3FvNVhXQ2t1QVFxTllGNjlMZTd4MVBTazFleUtQbQpGbG9kWjd2alZPcVBLdXFHTjlSUENEZUxVUFBQOHdOSTBIS1VLaVZJaTQ0SGIvTzkyeXRXekNlU3FBUXYzWnE0CnN5UzdmRGRLOFU4TGFxdkJRVHhqL3dJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFQKQVFIL0JBVXdBd0VCL3pBZEJnTlZIUTRFRmdRVW5LVUsxVUJUL09SMHBRd0d1UXdrZHBjVnpVUXdEUVlKS29aSQpodmNOQVFFTEJRQURnZ0VCQURRZmVMRDBmRDlMM0pXRkkwbVJpNXpuMlNkUHZicmh1bWZZNVBoUERUVnAyb0hhCkVQZUNjdXNDY2JZdWVBNXQrNzJyOVhvaVdLMzNMcVYzaXpkaGpiZFUyK012cmNUbUxlTGtFNjZqa1VBRTNYS00KNFptZGI3bHpjdmt1eUwxTW9iQ3hQb1ZFL0h2RWo2eDE4cFhRR3ZmSm13SzduVWJwRGxac2E2SS9IWTFOaFA4bQpscTQ1RlZQZ1l4SW5HdWxIcGJodDRxcE9CRmVJV1Y5TVFDZ1B2cDlPS0pYSVhKRDJlWjMvUGM1cnVDeWhZbVdECi91L29GNWRzYms4TENWSzNtMCtONjczZ3plM1Rtdk5BdTlpWGVzMnV4T0syRzFMMzJzY2xlSy96M2pnTmpnMGkKemFmYytEaHk1OEFYYytuT1Zhclo1dFN1UzErWHZpM3B1bmNVZFRBPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==";
                InputStream is = new java.io.ByteArrayInputStream(Base64.getDecoder().decode(encodedCA));

                CertificateFactory cf = CertificateFactory.getInstance("X.509");
                X509Certificate caCert = (X509Certificate) cf.generateCertificate(is);

                TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());
                ks.load(null);
                ks.setCertificateEntry("caCert", caCert);

                tmf.init(ks);

                SSLContext sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, tmf.getTrustManagers(), null);


                //TODO: remove it.
                System.out.println("devtest: " + username);
                System.out.println("devtest: " + password);
                System.out.println("devtest: " + dbName);
                System.out.println("devtest: " + host);
                System.out.println("devtest: " + port);

                ArangoDB arangoDB = new ArangoDB.Builder()
                        .useSsl(true)
                        .host("7fcd137d4e83.arangodb.cloud", 18529)
                        .user("root")
                        .sslContext(sslContext)
                        .password(password)
                        //.useSsl(false)
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
                    /*.flatMap(arangoDB -> Mono.zip(
                            Mono.just(arangoDB),
                            Mono.from(Mono.just(arangoDB.getVersion()))
                    ))
                    */
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
            Collection<CollectionEntity> collections = db.getCollections(options);

            return Flux.fromIterable(collections)
                    .filter(collectionEntity -> !collectionEntity.getIsSystem())
                    .flatMap(collectionEntity -> {
                        final ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
                        final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                        final String name = collectionEntity.getName();
                        tables.add(new DatasourceStructure.Table(
                                DatasourceStructure.TableType.COLLECTION,
                                "schema", // TODO: fix it.
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
