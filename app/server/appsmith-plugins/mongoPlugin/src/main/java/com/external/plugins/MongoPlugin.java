package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.math.BigInteger;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
public class MongoPlugin extends BasePlugin {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<AuthenticationDTO.Type> VALID_AUTH_TYPES = Set.of(
            AuthenticationDTO.Type.SCRAM_SHA_1,
            AuthenticationDTO.Type.SCRAM_SHA_256,
            AuthenticationDTO.Type.MONGODB_CR  // NOTE: Deprecated in the driver.
    );

    private static final String VALID_AUTH_TYPES_STR = VALID_AUTH_TYPES.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(", "));

    private static final int DEFAULT_PORT = 27017;

    public MongoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class MongoPluginExecutor implements PluginExecutor {

        /**
         * For reference on creating the json queries for Mongo please head to
         * https://docs.huihoo.com/mongodb/3.4/reference/command/index.html
         *
         * @param connection              : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<Object> execute(Object connection,
                                    DatasourceConfiguration datasourceConfiguration,
                                    ActionConfiguration actionConfiguration) {

            MongoClient mongoClient = (MongoClient) connection;
            if (mongoClient == null) {
                return Mono.error(new AppsmithPluginException("Mongo Client is null."));
            }

            ActionExecutionResult result = new ActionExecutionResult();

            String databaseName = datasourceConfiguration.getAuthentication() == null ?
                    null : datasourceConfiguration.getAuthentication().getDatabaseName();

            if (databaseName == null) {
                MongoClientURI mongoClientURI = new MongoClientURI(datasourceConfiguration.getUrl());
                databaseName = mongoClientURI.getDatabase();
            }

            MongoDatabase database = mongoClient.getDatabase(databaseName);

            Bson command = new Document(actionConfiguration.getQuery());

            try {
                Document mongoOutput = database.runCommand(command);

                JSONObject outputJson = new JSONObject(mongoOutput.toJson());

                //The output json contains the key "ok". This is the status of the command
                BigInteger status = outputJson.getBigInteger("ok");
                JSONArray headerArray = new JSONArray();

                if (BigInteger.ONE.equals(status)) {

                    //The json contains key "cursor" when find command was issued and there are 1 or more results. In case
                    //there are no results for find, this key is not present in the result json.
                    if (outputJson.has("cursor")) {
                        JSONArray outputResult = outputJson.getJSONObject("cursor").getJSONArray("firstBatch");
                        result.setBody(objectMapper.readTree(outputResult.toString()));
                    }

                    //The json contains key "n" when insert/update command is issued. "n" for update signifies the no of
                    //documents selected for update. "n" in case of insert signifies the number of documents inserted.
                    if (outputJson.has("n")) {
                        JSONObject body = new JSONObject().put("n", outputJson.getBigInteger("n"));
                        headerArray.put(body);
                    }

                    //The json key constains key "nModified" in case of update command. This signifies the no of
                    //documents updated.
                    if (outputJson.has("nModified")) {
                        JSONObject body = new JSONObject().put("nModified", outputJson.getBigInteger("nModified"));
                        headerArray.put(body);
                    }

                    /** TODO
                     * Go through all the possible fields that are returned in the output JSON and add all the fields
                     * that are important to the headerArray.
                     */
                }

                JSONObject statusJson = new JSONObject().put("ok", status);
                headerArray.put(statusJson);
                result.setHeaders(objectMapper.readTree(headerArray.toString()));
            } catch (Exception e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
            }

            return Mono.just(result);
        }

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            // TODO: ReadOnly seems to be not supported at the driver level. The recommendation is to connect with a
            //   user that doesn't have write permissions on the database.
            //   Ref: https://api.mongodb.com/java/2.13/com/mongodb/DB.html#setReadOnly-java.lang.Boolean-

            try {
                return Mono.just(new MongoClient(buildClientURI(datasourceConfiguration)));
            } catch (Exception e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
            }
        }

        public static MongoClientURI buildClientURI(DatasourceConfiguration datasourceConfiguration) {
            StringBuilder builder = new StringBuilder();

            boolean isSrv = Connection.Type.REPLICA_SET.equals(datasourceConfiguration.getConnection().getType());
            if (isSrv) {
                builder.append("mongodb+srv://");
            } else {
                builder.append("mongodb://");
            }

            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (authentication != null) {
                builder
                        .append(authentication.getUsername())
                        .append(':')
                        .append(authentication.getPassword())
                        .append('@');
            }

            for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                builder.append(endpoint.getHost());
                if (endpoint.getPort() != null) {
                    builder.append(':').append(endpoint.getPort());
                } else if (!isSrv) {
                    // Connections with +srv should NOT have a port.
                    builder.append(':').append(DEFAULT_PORT);
                }
                builder.append(',');
            }

            // Delete the trailing comma.
            builder.deleteCharAt(builder.length() - 1);

            if (authentication != null) {
                builder.append('/').append(authentication.getDatabaseName());
            }

            return new MongoClientURI(builder.toString());
        }

        @Override
        public void datasourceDestroy(Object connection) {
            MongoClient mongoClient = (MongoClient) connection;
            if (mongoClient != null) {
                mongoClient.close();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            if (CollectionUtils.isEmpty(endpoints)) {
                invalids.add("Missing endpoint(s).");

            } else if (Connection.Type.REPLICA_SET.equals(datasourceConfiguration.getConnection().getType())) {
                if (endpoints.size() > 1) {
                    invalids.add("Direct connections cannot be used with multiple endpoints." +
                            " Please provide a single endpoint.");
                }

                if (endpoints.get(0).getPort() != null) {
                    invalids.add("Port should not be set for REPLICA_SET connections.");
                }

            }

            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (authentication == null) {
                invalids.add("Missing authentication details.");

            } else {
                AuthenticationDTO.Type authType = authentication.getAuthType();

                if (VALID_AUTH_TYPES.contains(authType)) {

                    if (StringUtils.isEmpty(authentication.getUsername())) {
                        invalids.add("Missing username for authentication. Needed because authType is " + authType + ".");
                    }

                    if (StringUtils.isEmpty(authentication.getPassword())) {
                        invalids.add("Missing password for authentication. Needed because authType is " + authType + ".");
                    }

                } else {
                    invalids.add("Invalid authType. Must be one of " + VALID_AUTH_TYPES_STR);

                }

                if (StringUtils.isEmpty(authentication.getDatabaseName())) {
                    invalids.add("Missing database name.");
                }

            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(mongoClient -> {
                        try {
                            if (mongoClient != null) {
                                ((MongoClient) mongoClient).close();
                            }
                        } catch (Exception e) {
                            log.warn("Error closing MongoDB connection that was made for testing.", e);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

    }

}
