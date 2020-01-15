package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
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
import reactor.core.publisher.Mono;

import java.math.BigInteger;

@Slf4j
public class MongoPlugin extends BasePlugin {

    private static ObjectMapper objectMapper;

    public MongoPlugin(PluginWrapper wrapper) {
        super(wrapper);
        this.objectMapper = new ObjectMapper();
    }

    @Slf4j
    @Extension
    public static class MongoPluginExecutor implements PluginExecutor {

        /**
         * For reference on creating the json queries for Mongo please head to
         * https://docs.huihoo.com/mongodb/3.4/reference/command/index.html
         *
         * @param connection : This is the connection that is established to the data source. This connection is according
         *                   to the parameters in Datasource Configuration
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<Object> execute(Object connection,
                                    DatasourceConfiguration datasourceConfiguration,
                                    ActionConfiguration actionConfiguration) {

            ActionExecutionResult result = new ActionExecutionResult();
            MongoClient mongoClient = (MongoClient) connection;
            if (mongoClient == null) {
                return Mono.error(new Exception("Mongo Client is null."));
            }

            MongoClientURI mongoClientURI= new MongoClientURI(datasourceConfiguration.getUrl());

            String databaseName = datasourceConfiguration.getDatabaseName();
            if (databaseName == null) {
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
                if (BigInteger.ONE == status) {
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
                return Mono.error(e);
            }

            return Mono.just(result);
        }

        @Override
        public Object datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            MongoClientURI mongoClientURI= new MongoClientURI(datasourceConfiguration.getUrl());
            return new MongoClient(mongoClientURI);
        }

        @Override
        public void datasourceDestroy(Object connection) {
            MongoClient mongoClient = (MongoClient) connection;
            if (mongoClient != null) {
                mongoClient.close();
            }
        }

        @Override
        public Boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
            return true;
        }

    }

}
