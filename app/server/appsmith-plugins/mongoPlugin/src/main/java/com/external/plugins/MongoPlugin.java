package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.MongoTimeoutException;
import com.mongodb.client.ClientSession;
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

import java.math.BigDecimal;
import java.math.BigInteger;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class MongoPlugin extends BasePlugin {

    private static final Set<AuthenticationDTO.Type> VALID_AUTH_TYPES = Set.of(
            AuthenticationDTO.Type.SCRAM_SHA_1,
            AuthenticationDTO.Type.SCRAM_SHA_256,
            AuthenticationDTO.Type.MONGODB_CR  // NOTE: Deprecated in the driver.
    );

    private static final String VALID_AUTH_TYPES_STR = VALID_AUTH_TYPES.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(", "));

    private static final int DEFAULT_PORT = 27017;

    public static final String N_MODIFIED = "nModified";

    private static final String VALUE_STR = "value";

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
         * @return Result data from executing the action's query.
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

            // Explicitly set default database.
            String databaseName = datasourceConfiguration.getConnection().getDefaultDatabaseName();

            // If that's not available, pick the authentication database.
            final AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (StringUtils.isEmpty(databaseName) && authentication != null) {
                databaseName = authentication.getDatabaseName();
            }

            MongoDatabase database = mongoClient.getDatabase(databaseName);

            Bson command = Document.parse(actionConfiguration.getBody());

            try {
                Document mongoOutput = database.runCommand(command);

                JSONObject outputJson = new JSONObject(mongoOutput.toJson());

                //The output json contains the key "ok". This is the status of the command
                BigInteger status = outputJson.getBigInteger("ok");
                JSONArray headerArray = new JSONArray();

                if (BigInteger.ONE.equals(status)) {
                    result.setIsExecutionSuccess(true);

                    // For the `findAndModify` command, we don't get the count of modifications made. Instead, we either
                    // get the modified new value or the pre-modified old value (depending on the `new` field in the
                    // command. Let's return that value to the user.
                    if (mongoOutput.containsKey(VALUE_STR)) {
                        result.setBody(new JSONObject().put(VALUE_STR, mongoOutput.get(VALUE_STR)));
                    }

                    //The json contains key "cursor" when find command was issued and there are 1 or more results. In case
                    //there are no results for find, this key is not present in the result json.
                    if (outputJson.has("cursor")) {
                        JSONArray outputResult = (JSONArray) cleanUp(
                                outputJson.getJSONObject("cursor").getJSONArray("firstBatch"));
                        result.setBody(objectMapper.readTree(outputResult.toString()));
                    }

                    //The json contains key "n" when insert/update command is issued. "n" for update signifies the no of
                    //documents selected for update. "n" in case of insert signifies the number of documents inserted.
                    if (outputJson.has("n")) {
                        JSONObject body = new JSONObject().put("n", outputJson.getBigInteger("n"));
                        result.setBody(body);
                        headerArray.put(body);
                    }

                    //The json key contains key "nModified" in case of update command. This signifies the no of
                    //documents updated.
                    if (outputJson.has(N_MODIFIED)) {
                        JSONObject body = new JSONObject().put(N_MODIFIED, outputJson.getBigInteger(N_MODIFIED));
                        result.setBody(body);
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

            final Connection connection = datasourceConfiguration.getConnection();
            final List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();

            // Use SRV mode if using REPLICA_SET, AND a port is not specified in the first endpoint. In SRV mode, the
            // host and port details of individual shards will be obtained from the TXT records of the first endpoint.
            boolean isSrv = Connection.Type.REPLICA_SET.equals(connection.getType())
                    && endpoints.get(0).getPort() == null;

            if (isSrv) {
                builder.append("mongodb+srv://");
            } else {
                builder.append("mongodb://");
            }

            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (authentication != null) {
                builder
                        .append(urlEncode(authentication.getUsername()))
                        .append(':')
                        .append(urlEncode(authentication.getPassword()))
                        .append('@');
            }

            for (Endpoint endpoint : endpoints) {
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

            final String authenticationDatabaseName = authentication == null ? null : authentication.getDatabaseName();
            builder.append('/').append(authenticationDatabaseName);

            List<String> queryParams = new ArrayList<>();

            final SSLDetails sslDetails = connection.getSsl();
            if (sslDetails != null && !SSLDetails.AuthType.NO_SSL.equals(sslDetails.getAuthType())) {
                queryParams.add("ssl=true");
            }

            if (authentication != null && authentication.getAuthType() != null) {
                queryParams.add("authMechanism=" + authentication.getAuthType().name().replace('_', '-'));
            }

            if (!queryParams.isEmpty()) {
                builder.append('?');
                for (String param : queryParams) {
                    builder.append(param).append('&');
                }
                // Delete the trailing ampersand.
                builder.deleteCharAt(builder.length() - 1);
            }

            final String uri = builder.toString();
            log.info("MongoPlugin URI: `{}`.", uri);
            return new MongoClientURI(uri);
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
                if (endpoints.size() == 1 && endpoints.get(0).getPort() != null) {
                    invalids.add("REPLICA_SET connections should not be given a port." +
                            " If you are trying to specify all the shards, please add more than one.");
                }

            }

            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (authentication == null) {
                invalids.add("Missing authentication details.");

            } else {
                AuthenticationDTO.Type authType = authentication.getAuthType();

                if (authType != null && VALID_AUTH_TYPES.contains(authType)) {

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
                        ClientSession clientSession = null;

                        try {
                            // Not using try-with-resources here since we want to close the *session* before closing the
                            // MongoClient instance.
                            clientSession = ((MongoClient) mongoClient).startSession();

                        } catch (MongoTimeoutException e) {
                            log.warn("Timeout connecting to MongoDB from MongoPlugin.", e);
                            return new DatasourceTestResult("Timed out trying to connect to MongoDB host.");

                        } catch (Exception e) {
                            return new DatasourceTestResult(e.getMessage());

                        } finally {
                            if (clientSession != null) {
                                clientSession.close();
                            }
                            if (mongoClient instanceof MongoClient) {
                                ((MongoClient) mongoClient).close();
                            }

                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }

        private static String urlEncode(String text) {
            return URLEncoder.encode(text, StandardCharsets.UTF_8);
        }

    }

    private static Object cleanUp(Object object) {
        if (object instanceof JSONObject) {
            JSONObject jsonObject = (JSONObject) object;
            final boolean isSingleKey = jsonObject.keySet().size() == 1;

            if (isSingleKey && "$numberLong".equals(jsonObject.keys().next())) {
                return jsonObject.getBigInteger("$numberLong");

            } else if (isSingleKey && "$oid".equals(jsonObject.keys().next())) {
                return jsonObject.getString("$oid");

            } else if (isSingleKey && "$date".equals(jsonObject.keys().next())) {
                return DateTimeFormatter.ISO_INSTANT.format(
                        Instant.ofEpochMilli(jsonObject.getLong("$date"))
                );

            } else if (isSingleKey && "$numberDecimal".equals(jsonObject.keys().next())) {
                return new BigDecimal(jsonObject.getString("$numberDecimal"));

            } else {
                for (String key : new HashSet<>(jsonObject.keySet())) {
                    jsonObject.put(key, cleanUp(jsonObject.get(key)));
                }

            }

        } else if (object instanceof JSONArray) {
            Collection<Object> cleaned = new ArrayList<>();

            for (Object child : (JSONArray) object) {
                cleaned.add(cleanUp(child));
            }

            return new JSONArray(cleaned);

        }

        return object;
    }

}
